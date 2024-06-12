import mongoose from "mongoose";

const postSchema = new mongoose.Schema({

    postImages:{
        type:[String],
        required:true,
    },
    caption:{
        type:String,
        trim:true,
        required:true
    },
    postedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    }
})

export default mongoose.model("Post", postSchema);