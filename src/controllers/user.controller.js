import { userModel } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { joiSigninSchema, joiSignupSchema } from "../helpers/validationSchema.js";
import createError from "http-errors";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { signup, signin }