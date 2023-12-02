// import { Express } from "express";
// import Joi from "joi";
import { userModel } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { joiSignupSchema } from "../helpers/validationSchema.js";
import createError from "http-errors";
import { ApiResponse } from "../utils/ApiResponse.js";

const signup = asyncHandler(async (req, res) => {
    //taking input from user
    const { email, password, username } = req.body;
    const result = await joiSignupSchema.validateAsync(req.body);
    const doesExist = await user.findOne({ $or: [{ email }, { username }] });
    if (doesExist) throw createError.Conflict(`${email} is already registered`);

    const user = new userModel(result);
    await user.save();

    //creating new access and refresh token
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.genrateRefreshToken();

    const createdUser = await user.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw createError.InternalServerError();
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    );

})

export { signup }