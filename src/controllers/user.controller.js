import { userModel } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { joiSignupSchema } from "../helpers/validationSchema.js";
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

    const createdUser = await userModel.findById(user._id).select(
        "-password"
    );

    if (!createdUser) {
        throw createError.InternalServerError();
    }

    //attaching accessToken which is not in Schema
    const resWithTokens = {
        ...createdUser.toObject(),
        accessToken:accessToken
    }
    console.log(resWithTokens)
    return res.status(201).json(
        new ApiResponse(201, resWithTokens, "User registered Successfully")
    );

})

export { signup }