import { userModel } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { joiSigninSchema, joiSignupSchema } from "../helpers/validationSchema.js";
import createError from "http-errors";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

//for generation of otp
import Randomstring from "randomstring";
import { sendEmail } from "../utils/EmailSender.js";
import { otpModel } from "../models/otp.model.js";

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

});

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

});

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
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw createError.Unauthorized("Refresh Token Not Found");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await userModel.findById(decodedToken?._id);
        if (!user) throw createError.InternalServerError();

        if (incomingRefreshToken !== user?.refreshToken) {
            throw createError.Unauthorized("Refresh Token expired");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        user.refreshToken = refreshToken;
        await user.save();
        const cookieOptions = { httpOnly: true, secure: true };

        res.status(200)
            .clearCookie("accessToken", cookieOptions)
            .clearCookie("refreshToken", cookieOptions)
            .cookie("accessToken", accessToken)
            .cookie("refeshToken", refreshToken)
            .json(new ApiResponse(200, { accessToken, refreshToken }, "Access Token Refreshed"));

    } catch (error) {
        throw createError.Unauthorized(error?.message || "Invalid Refresh Token");
    }
});

const sendOTP = asyncHandler(async (req, res) => {

    const email = req.user.email;
    const mobile = req.body.mobile;

    //creating the email and mobile OTPs
    const emailOTP = Randomstring.generate({
        length: 6,
        charset: "numeric"
    }); 
    
    const mobileOTP = Randomstring.generate({
        length: 6,
        charset: "numeric"
    });

    //hashing the otps
    const hashedEmailOTP = await bcrypt.hash(emailOTP, 10);
    const hashedMobileOTP = await bcrypt.hash(mobileOTP, 10);

    console.log(emailOTP, mobileOTP);

    //saving the email,mobile and otps to database
    const doesExist = await otpModel.findOne({ email });
    if (!doesExist) {
        const otp = new otpModel({
            email:email,
            mobile:mobile,
            emailOTP:hashedEmailOTP,
            mobileOTP:hashedMobileOTP
        });

        await otp.save();
    } else {
        const otp = await otpModel.findOneAndUpdate({ email }, { emailOTP:hashedEmailOTP, mobileOTP:hashedMobileOTP });
    }

    //creating the otp email
    const subject = "ShareSphere Email OTP Verification";
    const emailMessage = `The email verification OTP code is ${emailOTP}`;

    //sending the otps
    await sendEmail(email, subject, emailMessage);

    res.status(200).json(new ApiResponse(200, {}, "OTP Sent Successfully"));

});

const verifyOTP = asyncHandler(async (req, res) => {

    const { emailOTP, mobileOTP } = req.body;

    const userOTP = await otpModel.findOne({ email: req.user.email });

    //either user is not applied for verification yet or it is already verified
    if (!userOTP) throw createError.BadRequest("Send OTP Request");

    const isEmailVerified=await bcrypt.compare(emailOTP.toString(), userOTP.emailOTP);
    const isMobileVerified=await bcrypt.compare(mobileOTP.toString(), userOTP.mobileOTP);

    if (!isEmailVerified || !isMobileVerified) throw createError.Conflict("Invalid OTP");

    const updatedUser = await userModel.findOneAndUpdate({ email: req.user.email }, { isVerified: true, mobile: userOTP.mobile }, { new: true }).select("-password -refreshToken");

    //delete the otps from database
    await otpModel.findOneAndDelete({ email: req.user.email });

    res.status(200).json(new ApiResponse(200, updatedUser, "OTP Verified Successfully"));

});

const details = asyncHandler(async (req, res) => {
    
    const {fullName,gender,dob,bio} = req.body;
});

export { signup, signin, logout, refreshAccessToken, sendOTP, verifyOTP, details };