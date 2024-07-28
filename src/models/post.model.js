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
    },
    likeCount:{
        type:Number,
        default:0
    },
    commentCount:{
        type:Number,
        default:0
    }
},
    { timestamps: true })

export default mongoose.model("Post", postSchema);