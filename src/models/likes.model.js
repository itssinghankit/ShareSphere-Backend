import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
        index:true
    },
    likedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index:true
    }
})

export default mongoose.model("Like", likeSchema);