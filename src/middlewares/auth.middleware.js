import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import createError from "http-errors"
import { userModel } from "../models/user.model.js"
import cookie from "cookie"

const verifyJWT = asyncHandler(async (req, res, next) => {

    try {
        const token = req.header("Authorization")?.replace("Bearer ", "") || req.cookies?.accessToken;

        if (!token) {
            throw createError.Unauthorized("Token Not found");
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await userModel.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw createError.Unauthorized("Invalid access token")
        }
        req.user = user;
        //TODO: we need to check for refreshToken otherwise anyone with accesstoken can log out
        next();
    }
    catch (error) {
        throw createError.Unauthorized(error.message || "Invalid access token")
    }

})

// const verifyJWTSocket = asyncHandlerSocket(async (socket, next) => {

//     try {
//         const token = socket.handshake.headers.authorization?.split(' ')[1];

//         if (!token) {
//             throw createError.Unauthorized("Token Not found");
//         }
//         const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
//         const user = await userModel.findById(decodedToken?._id).select("-password -refreshToken");

//         if (!user) {
//             throw createError.InternalServerError();
//         }
//         socket.user = user;
//         //TODO: we need to check for refreshToken otherwise anyone with accesstoken can log out
//         next();
//     }
//     catch (error) {
//        throw createError.Unauthorized(error.message || "Invalid access token")
//     }

// })

const verifyJWTSocket = async (socket) => {

    try {
        // parse the cookies from the handshake headers (This is only possible if client has `withCredentials: true`)
        const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

        const token = socket.handshake.auth?.token ||cookies.accessToken

        if (!token) {
            throw createError.Unauthorized("Un-authorized handshake. Token is missing");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await userModel.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw createError.Unauthorized("Un-authorized handshake. Token is invalid")
        }
        socket.user = user;

    } catch (error) {
        throw createError.Unauthorized(error.message || "Un-authorized handshake")
    }
}

export { verifyJWT, verifyJWTSocket }
