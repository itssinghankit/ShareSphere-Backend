import { userModel } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { joiSigninSchema, joiSignupSchema } from "../helpers/validationSchema.js";
import createError from "http-errors";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await userModel.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw createError.InternalServerError("Something went wrong while generating access and refresh token");
    }

}

const signup = asyncHandler(async (req, res) => {

    //taking email and username to check if user already exist
    const { email, username } = req.body;
    const result = await joiSignupSchema.validateAsync(req.body);

    const doesExist = await userModel.findOne({ $or: [{ email }, { username }] });
    if (doesExist) throw createError.Conflict("email or username is already registered");

    const user = new userModel(result);
    await user.save();

    //creating new access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    //removing password field from found user
    const SignedupUser = await userModel.findById(user._id).select("-password -refreshToken");

    if (!SignedupUser) {
        throw createError.InternalServerError();
    }

    const cookieOptions = {
        httpOnly: true,
        secure: true
    }

    //can also use this format ...SignedupUser.toObject()
    return res.status(201)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(201, { user: SignedupUser, accessToken, refreshToken }, "User registered Successfully")
        );

})

const signin = asyncHandler(async (req, res) => {

    const { usernameOrEmail } = req.body;

    const result = await joiSigninSchema.validateAsync(req.body);

    const user = await userModel.findOne({ $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }] });
    if (!user) throw createError.NotFound("User Not Registered");

    const isPassMatch = await user.isPasswordCorrect(result.password);
    if (!isPassMatch) throw createError.Unauthorized("Invalid Credentials");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    //removing password and refresh field from logedin user
    const logedinUser = await userModel.findById(user._id).select("-password -refreshToken");

    if (!logedinUser) {
        throw createError.InternalServerError();
    }

    const cookieOptions = {
        httpOnly: true,
        secure: true
    }

    //can also use this format ...logedinUser.toObject()
    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(200, { user: logedinUser, accessToken, refreshToken }, "Signed in Successfully")
        );

})

const logout = asyncHandler(async (req, res) => {
   await userModel.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } }, // Use $unset to remove the refreshToken field
    { new: true });

        const cookieOptions = {
            httpOnly: true,
            secure: true
        }  
        
        return res.status(200)
        .clearCookie("accessToken",cookieOptions)
        .clearCookie("refreshToken",cookieOptions)
        .json(new ApiResponse(200,{},"logged out successfully"));
});

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken ||req.body.refreshToken;

    if(!incomingRefreshToken){
        throw createError.Unauthorized("Refresh Token Not Found");
    }

    try {
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    console.log(decodedToken)
        const user= await userModel.findById(decodedToken?._id);
        if(!user) throw createError.InternalServerError();
        console.log(incomingRefreshToken)
    console.log(user)
        if(incomingRefreshToken!==user?.refreshToken){
            throw createError.Unauthorized("Refresh Token expired");
        }
        
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        user.refreshToken=refreshToken;
        await user.save()
        const cookieOptions={httpOnly:true,secure:true};
    
        res.status(200)
        .clearCookie("accessToken",cookieOptions)
        .clearCookie("refreshToken",cookieOptions)
        .cookie("accessToken",accessToken)
        .cookie("refeshToken",refreshToken)
        .json(new ApiResponse(200,{accessToken,refreshToken},"Access Token Refreshed"));
    
    } catch (error) {
        throw createError.Unauthorized(error?.message || "Invalid Refresh Token");
    }
})

export { signup, signin, logout, refreshAccessToken };