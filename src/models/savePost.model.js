import mongoose from "mongoose";

const savedPostSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
        index:true
    },
    savedById: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index:true
    }
});

export default mongoose.model("SavedPost", savedPostSchema);