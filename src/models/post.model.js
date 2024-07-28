import { Timestamp } from "mongodb";
import mongoose from "mongoose";

const postSchema = new mongoose.Schema({

    postImages: {
        type: [String],
        required: true,
    },
    caption: {
        type: String,
        trim: true
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    }
},
    { timestamps: true })

export default mongoose.model("Post", postSchema);