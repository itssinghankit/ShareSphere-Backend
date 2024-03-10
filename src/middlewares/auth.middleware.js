import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import createError from "http-errors"
import { userModel } from "../models/user.model.js"

export const verifyJWT = asyncHandler(async (req, res, next) => {
    
    const token =  req.header("Authorization")?.replace("Bearer ", "") || req.cookies?.accessToken;
    
    if (!token) {
        throw createError.Unauthorized("Token Not found");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
    const user = await userModel.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw createError.InternalServerError();
        }
        req.user = user;
//TODO: we need to check for refreshToken otherwise anyone with accesstoken can log out
    next();

})