import { BlogModel } from "../models/cyberStrikeModels/blog.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const blog=asyncHandler(async(req,res)=>{
    const blog=await BlogModel.find();
    res.status(200).json(blog);
}); 

export {blog};


