
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    commentedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Post",
        required: true
    }
},
{
    timestamps: true
});

//by default it take name of commentModel 
export default mongoose.model("Comment", commentSchema);