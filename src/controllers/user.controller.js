import { userModel } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { joiSigninSchema, joiSignupSchema } from "../helpers/validationSchema.js";
import createError from "http-errors";
import { ApiResponse } from "../utils/ApiResponse.js";

const signup = asyncHandler(async (req, res) => {

    //taking email and username to check if user already exist
    const { email, username } = req.body;
    const result = await joiSignupSchema.validateAsync(req.body);

    const doesExist = await userModel.findOne({ $or: [{ email }, { username }] });
    if (doesExist) throw createError.Conflict(`${email} is already registered`);

    const user = new userModel(result);

    //creating new access and refresh token
    const accessToken = await user.generateAccessToken();
    user.refreshToken = await user.generateRefreshToken();

    const savedUser = await user.save();

    //removing password field from found user
    const createdUser = await userModel.findById(user._id).select(
        "-password"
    );

    if (!createdUser) {
        throw createError.InternalServerError();
    }

    //attaching accessToken which is not in Schema
    const resWithTokens = {
        ...createdUser.toObject(),
        accessToken: accessToken
    }

    return res.status(201).json(
        new ApiResponse(201, resWithTokens, "User registered Successfully")
    );

})

const signin = asyncHandler(async (req, res) => {

    const { usernameOrEmail } = req.body;

    const result = await joiSigninSchema.validateAsync(req.body);

    const user = await userModel.findOne({ $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }] });
    if (!user) throw createError.NotFound("User Not Registered");

    const isPassMatch = await user.isPasswordCorrect(result.password);
    if (!isPassMatch) throw createError.Unauthorized("Invalid Credentials");

    const accessToken = user.generateAccessToken();

    //removing password field from found user
    const createdUser = await userModel.findById(user._id).select(
        "-password"
    );

    if (!createdUser) {
        throw createError.InternalServerError();
    }

    //attaching accessToken which is not in Schema
    const resWithTokens = {
        ...createdUser.toObject(),
        accessToken: accessToken
    }

    return res.status(200).json(
        new ApiResponse(200, resWithTokens, "Signed in Successfully")
    );

})

export { signup, signin }