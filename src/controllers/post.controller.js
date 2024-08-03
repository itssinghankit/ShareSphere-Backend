import postModel from "../models/post.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getDataUri } from "../middlewares/dataUri.middleware.js";
import createError from "http-errors";
import { uploadOnCloudinary } from "../middlewares/cloudinary.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import likesModel from "../models/likes.model.js";
import { joiFollowUser, joiLikePost, joiViewAccount, joiViewAccountFollowers } from "../helpers/postValidationSchema.js";
import followModel from "../models/follow.model.js";
import { userModel } from "../models/user.model.js";
import mongoose from "mongoose";

//helper function to convert string to object id
const toObjectId = (id) => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;

const savePost = asyncHandler(async (req, res) => {

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
    const posts = await postModel.find().populate("postedBy", "_id username avatar").sort({ createdAt: -1 });

    //for checking if we follow the post owner or not
    let isFollowed = false
    const followerId = req.user._id;
    const accountId = posts.map(post => post.postedBy._id);
    const user = await followModel.findOne({ followerId, accountId })
    if (user) {
        isFollowed = true
    }

    res.status(200).json(new ApiResponse(200, { ...posts, isFollowed }, "All posts"));
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
                as: "userDetails"
            }
        },
        {
            $addFields: {
                avatar: "$userDetails.avatar",
                fullName: "$userDetails.fullName",
                username: "$userDetails.username",
                isFollowed: { $in: [toObjectId(userId), followerId] }
            }
        }
    ])

    if (followers.length == 0) {
        // throw createError.NotFound("No user with this account id exist")
    }

    res.status(200).json(new ApiResponse(200, followers, "followers fetched successfully"))

})

export { savePost, getAllPosts, getMyPosts, likePost, followAccount, viewAccount, viewAccountFollowers };