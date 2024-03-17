import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    topic:{
        type: String
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        required: true
    }
});

export const BlogModel = mongoose.model("Blog", blogSchema);

