import postModel from "../models/post.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getDataUri } from "../middlewares/dataUri.middleware.js";
import createError from "http-errors";
import { uploadOnCloudinary } from "../middlewares/cloudinary.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import likesModel from "../models/likes.model.js";
import { joiLikePost } from "../helpers/postValidationSchema.js";

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
    res.status(200).json(new ApiResponse(200, posts, "All Posts"));
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

    //increase the like count of the post
    await postModel.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } });

    if (!like) {
        throw createError.BadRequest();
    }

    res.status(200).json(new ApiResponse(200, {}, "Post Liked Successfully"));
})

export { savePost, getAllPosts, getMyPosts, likePost };