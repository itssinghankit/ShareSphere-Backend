import postModel from "../models/post.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getDataUri } from "../middlewares/dataUri.middleware.js";
import createError from "http-errors";
import { uploadOnCloudinary } from "../middlewares/cloudinary.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import likesModel from "../models/likes.model.js";
import { joiComment, joiFollowUser, joiLikePost, joiSavePost, joishowComments, joiViewAccount, joiViewAccountFollowers, joiViewAccountFollowing } from "../helpers/postValidationSchema.js";
import followModel from "../models/follow.model.js";
import { userModel } from "../models/user.model.js";
import mongoose from "mongoose";
import savePostModel from "../models/savePost.model.js";
import commentModel from "../models/comment.model.js";
import createHttpError from "http-errors";

//helper function to convert string to object id
const toObjectId = (id) => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;

const createPost = asyncHandler(async (req, res) => {

    //checks validation if failed then throws error else saves the details to result
    // const result = await joiDetailsSchema.validateAsync(req.body).catch(error => { throw createError.BadRequest(error.details[0].message) });

    const caption = req.body.caption;
    const files = req.files;

    //check if user sended images or not
    if (!files.length) {
        throw createError.BadRequest("Please Upload Image");
    }

    let fileURIsArr = [];
    files.forEach(element => {
        fileURIsArr.push(getDataUri(element));
    });

    let postImagesUrl = [];

    //cant use forEach with async await and we can use promise also here
    for (const fileUri of fileURIsArr) {
        const postDetails = await uploadOnCloudinary(fileUri.content)

        //In case image is not uploaded on cloudinary
        if (!postDetails)
            throw createError.InternalServerError();

        //pushing the url of the image to the array
        postImagesUrl.push(postDetails.url);

    }

    //saving data to post model
    const user = await postModel.create({
        caption: caption,
        postImages: postImagesUrl,
        postedBy: req.user._id
    });

    if (!user) {
        throw createError.BadRequest();
    }

    res.status(200).json(new ApiResponse(200, user, "Post Uploaded Successfully"));

});

const getAllPosts = asyncHandler(async (req, res) => {

    //pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await postModel.find()
        .populate("postedBy", "_id username avatar fullName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalPosts = await postModel.countDocuments();
    const totalPages = Math.ceil(totalPosts / limit);
    const currentPage = page;

    //for checking if we follow the post owner or not

    //cant use async await with mapdirectly otherwise it return [ Promise { <pending> },...] so we use promise here
    const response = await Promise.all(posts.map(async (post) => {
        const userId = req.user._id
        const accountId = post.postedBy._id

        let isfollowed = await followModel.findOne({ followerId: userId, accountId })

        //we assume that we follow ourself
        if (userId.toString() === toObjectId(accountId).toString()) {
            isfollowed = true
        }

        //checking if the post is saved or not by user
        const postId = post._id
        const isSaved = await savePostModel.findOne({ postId, savedById: userId })

        //checking if the post is likes or not by user
        const isLiked = await likesModel.findOne({ postId, likedBy: userId })

        return {
            ...post.toObject(), isFollowed: !!isfollowed, isSaved: !!isSaved, isLiked: !!isLiked
        }
        /*
        * A single ! operator is the logical NOT operator. It converts the operand to a boolean value and then inverts it.
        * Using !! (double NOT) converts the value to a boolean without inverting it a second time, effectively giving you the "truthy" or "falsy" value of the operand. */

    })
    )

    res.status(200).json(new ApiResponse(200, { posts: response, totalPosts, totalPages, currentPage }, "All posts"));
})

const getMyPosts = asyncHandler(async (req, res) => {
    const currentUserId = req.user._id;
    const posts = await postModel.find({ postedBy: currentUserId }).select("-postedBy").sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, posts, "These are your posts"));
})

const likePost = asyncHandler(async (req, res) => {

    //validate post id
    const result = await joiLikePost.validateAsync(req.params).catch(error => { throw createError.BadRequest(error.details[0].message) });
    const postId = result.postId;
    const userId = req.user._id;

    //check if post with postId exist or not
    const postExist = await postModel.findById(postId)
    if (!postExist) {
        throw createError.NotFound("No post with this post id exist")
    }

    //check if already liked or not
    const alreadyLiked = await likesModel.findOne({ postId: postId, likedBy: userId });
    if (alreadyLiked) {
        //if already liked then unlike the post
        await alreadyLiked.deleteOne();

        //decrease the like count of the post
        await postModel.findByIdAndUpdate(postId, { $inc: { likeCount: -1 } });

        return res.status(200).json(new ApiResponse(200, {}, "Post Unliked Successfully"));
    }

    const like = await likesModel.create({ postId: postId, likedBy: userId })

    if (!like) {
        throw createError.BadRequest();
    }

    //increase the like count of the post
    await postModel.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } });


    res.status(200).json(new ApiResponse(200, {}, "Post Liked Successfully"));
})

const followAccount = asyncHandler(async (req, res) => {

    const result = await joiFollowUser.validateAsync(req.params).catch(error => { throw createError.BadRequest(error.details[0].message) });

    const followerId = req.user._id
    const accountId = result.accountId;

    //check if user with account id exist or not
    const userExist = await userModel.findById(accountId)
    if (!userExist) {
        throw createError.NotFound("No user with this account id exist")
    }

    //check if followeId is same as accountId, we cant follow ourself
    if (followerId.toString() == accountId.toString()) {
        throw createError.BadRequest("You cant follow yourself");
    }

    const user = await followModel.findOne({ followerId, accountId })

    //if user exist means it is already following so unfollow account
    if (user) {
        await user.deleteOne();
        return res.status(200).json(new ApiResponse(200, {}, "Unfollowed Successfully"));
    }

    //else follow the account
    await followModel.create({ followerId, accountId });
    res.status(200).json(new ApiResponse(200, {}, "Followed Successfully"));
})

const viewAccount = asyncHandler(async (req, res) => {

    const result = await joiViewAccount.validateAsync(req.params).catch(error => { throw createError.BadRequest(error.details[0].message) });

    const accountId = result.accountId

    const details = await userModel.aggregate([
        {
            $match: {
                _id: toObjectId(accountId)
            }
        },
        {
            $lookup: {
                from: "follows",
                localField: "_id",
                foreignField: "accountId",
                as: "followers"
            }
        },
        {
            $lookup: {
                from: "follows",
                localField: "_id",
                foreignField: "followerId",
                as: "following"
            }
        },
        {
            $addFields: {
                followers: { $size: "$followers" },
                following: { $size: "$following" },
                isFollowed: { $in: [toObjectId(req.user._id), "$followers.followerId"] }
            }
        },
        {
            $project: {
                _id: 1,
                username: 1,
                fullName: 1,
                gender: 1,
                bio: 1,
                avatar: 1,
                followers: 1,
                following: 1,
                isFollowed: 1
            }
        }

    ])

    if (details.length == 0) {
        throw createError.NotFound("No user with this account id exist")
    }

    res.status(200).json(new ApiResponse(200, details[0], "sucessfully fetched"))

})

const viewAccountFollowers = asyncHandler(async (req, res) => {
    const result = await joiViewAccountFollowers.validateAsync(req.params).catch(error => { throw createError.BadRequest(error.details[0].message) });

    const accountId = result.accountId
    const userId = req.user._id

    const isUserExist = await userModel.find({ _id: accountId })
    if (!isUserExist) {
        throw createError.NotFound("No user with this account id exist")
    }

    const followers = await followModel.aggregate([
        {
            $match: {
                accountId: toObjectId(accountId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "followerId",
                foreignField: "_id",
                as: "followerDetails"
            }
        },
        {
            $addFields: {
                avatar: { $arrayElemAt: ["$followerDetails.avatar", 0] },
                fullName: { $arrayElemAt: ["$followerDetails.fullName", 0] },
                username: { $arrayElemAt: ["$followerDetails.username", 0] },
                followerId: { $arrayElemAt: ["$followerDetails._id", 0] }
            }
        },
        {
            //person id is the id of that person whose followers we want to fetch here it is follower id
            $lookup: {
                from: "follows",
                let: { personId: "$followerId" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$accountId", "$$personId"]
                            }
                        }
                    }
                ],
                as: "followerFollowers"
            }
        },
        {
            $addFields: {
                isFollowed: { $in: [toObjectId(userId), "$followerFollowers.followerId"] }
            }
        },
        {
            $project: {
                avatar: 1,
                fullName: 1,
                username: 1,
                followerId: 1,
                isFollowed: 1
            }
        }

    ])

    if (followers.length == 0) {
        // throw createError.NotFound("No user with this account id exist")
    }

    res.status(200).json(new ApiResponse(200, { followers, followersCount: followers.length }, "followers fetched successfully"))

})

const viewAccountFollowing = asyncHandler(async (req, res) => {
    const result = await joiViewAccountFollowing.validateAsync(req.params).catch(error => { throw createError.BadRequest(error.details[0].message) });

    const accountId = result.accountId
    const userId = req.user._id

    const isUserExist = await userModel.find({ _id: accountId })
    if (!isUserExist) {
        throw createError.NotFound("No user with this account id exist")
    }

    const following = await followModel.aggregate([
        {
            $match: {
                followerId: toObjectId(accountId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "accountId",
                foreignField: "_id",
                as: "followingDetails"
            }
        },
        {
            $addFields: {
                avatar: { $arrayElemAt: ["$followingDetails.avatar", 0] },
                fullName: { $arrayElemAt: ["$followingDetails.fullName", 0] },
                username: { $arrayElemAt: ["$followingDetails.username", 0] },
                followingId: { $arrayElemAt: ["$followingDetails._id", 0] }
            }
        },
        {
            $lookup: {
                from: "follows",
                let: { personId: "$accountId" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$accountId", "$$personId"]
                            }
                        }
                    }
                ],
                as: "followingFollowers"
            }
        },
        {
            $addFields: {
                isFollowed: { $in: [toObjectId(userId), "$followingFollowers.followerId"] }
            }
        },
        {
            $project: {
                avatar: 1,
                fullName: 1,
                username: 1,
                followingId: 1,
                following: 1,
                isFollowed: 1
            }
        }

    ])



    res.status(200).json(new ApiResponse(200, { following, followingCount: following.length }, "following fetched successfully"))

})

const savePost = asyncHandler(async (req, res) => {

    const result = await joiSavePost.validateAsync(req.params).catch(error => { throw createError.BadRequest(error.details[0].message) });

    const postId = result.postId;
    const userId = req.user._id;

    //check if post with postId exist or not
    const postExist = await postModel.findById(postId)
    if (!postExist) {
        throw createError.NotFound("No post with this post id exist")
    }

    //check if already saved or not
    const alreadySaved = await savePostModel.findOne({ postId, savedById: userId });

    if (alreadySaved) {
        //unsave the post
        await alreadySaved.deleteOne()
        return res.status(200).json(new ApiResponse(200, {}, "Post Unsaved Successfully"));
    }

    //post not saved so save post
    const savedPost = await savePostModel.create({ postId, savedById: userId })
    if (!savedPost) {
        throw createError.BadRequest("Cannot save post");
    }

    res.status(200).json(new ApiResponse(200, {}, "Post Saved Successfully"));

})

const showSavedPost = asyncHandler(async (req, res) => {

    const savedPosts = await savePostModel.aggregate(
        [
            {
                $match: {
                    savedById: toObjectId(req.user._id)
                }
            },
            {
                $lookup: {
                    from: "posts",
                    localField: "postId",
                    foreignField: "_id",
                    as: "postDetails"
                }
            },
            {
                $addFields: {
                    postDetails: { $first: "$postDetails" }
                }
            },

            {
                $lookup: {
                    from: "users",
                    localField: "postDetails.postedBy",
                    foreignField: "_id",
                    as: "postedBy"
                }
            },
            {
                $addFields: {
                    postedBy: { $first: "$postedBy" }
                }
            },
            {
                $project: {
                    postDetails: 1,
                    "postedBy._id": 1,
                    "postedBy.username": 1,
                    "postedBy.fullName": 1,
                    "postedBy.avatar": 1
                }
            }

        ]
    )

    // const response = await Promise.all(savedPosts.map(async (post) => {
    //     const followerId = req.user._id
    //     const accountId = post.postedBy._id
    //     console.log(...post.toObject())

    //     const isfollowed = await followModel.findOne({ followerId, accountId })
    //     return {
    //         ...post.toObject(), isFollowed: !!isfollowed
    //     }
    // }))

    res.status(200).json(new ApiResponse(200, savedPosts, "All saved posts"));

})

const searchUser = asyncHandler(async (req, res) => {

    const { search } = req.params;

    const users = await userModel.find({
        $or: [
            { username: { $regex: search, $options: "i" } },
            { fullName: { $regex: search, $options: "i" } }
        ]
    }).select("_id username fullName avatar")

    //for checking if we follow the post owner or not

    const response = await Promise.all(users.map(async (user) => {
        const userId = req.user._id
        const accountId = user._id

        let isfollowed = await followModel.findOne({ followerId: userId, accountId })

        //we assume that we follow ourself
        if (userId.toString() === toObjectId(accountId).toString()) {
            isfollowed = true
        }

        return {
            ...user.toObject(), isFollowed: !!isfollowed
        }
    })
    )

    res.status(200).json(new ApiResponse(200, response, "Search done successfully"));

})

const comment = asyncHandler(async (req, res) => {
    const result = await joiComment.validateAsync({ ...req.params, ...req.body }).catch(error => { throw createError.BadRequest(error.details[0].message) });
    const { postId, content } = result;

    const comment = await commentModel.create({
        content: content,
        commentedBy: req.user._id,
        postId: postId
    });

    if (!comment) {
        throw createError.BadRequest("Comment not added");
    }

    const increaseComment = await postModel.findByIdAndUpdate({_id:postId}, { $inc: { commentCount: 1 } });

    if(!increaseComment){
        throw createError.InternalServerError("Comment added by its count not updated.");
    }

    res.status(200).json(new ApiResponse(200, comment, "Comment added successfully"));

})

const showComments = asyncHandler(async (req, res) => {
    const result = await joishowComments.validateAsync(req.params).catch(error => { throw createError.BadRequest(error.details[0].message) });
    const { postId } = result;

    const comments = await commentModel.find({ postId }).populate("commentedBy", "username avatar fullName _id").select("content commentedBy createdAt").sort({ createdAt: -1 });

    if(!comments){
        throw createError.BadRequest("Check Post Id");
    }

    if (comments.length == 0) {
        res.status(200).json(new ApiResponse(200, comments, "No comments found"));
    }

    res.status(200).json(new ApiResponse(200, comments, "All comments fetched"));
})

export { createPost, getAllPosts, getMyPosts, likePost, followAccount, viewAccount, viewAccountFollowers, viewAccountFollowing, savePost, showSavedPost, searchUser, comment,showComments };