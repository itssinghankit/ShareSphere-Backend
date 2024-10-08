import { userModel } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { joiIsUsernameAvailable,joiDetailsSchema, joiForgetPassDetails, joiForgetPassVerify, joiSendForgetPassOTP, joiSigninSchema, joiSignupSchema, joiUpdateAvatarBio, joiUpdateDetails, joiUpdateEmailSendOtp, joiUpdateEmailVerifyOtp, joiUpdateUsername, joiDate } from "../helpers/validationSchema.js";
import createError from "http-errors";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { uploadOnCloudinary } from "../middlewares/cloudinary.middleware.js";
import { getDataUri } from "../middlewares/dataUri.middleware.js";

//for generation of otp
import Randomstring from "randomstring";
import { sendEmail } from "../utils/EmailSender.js";
import { otpModel } from "../models/otp.model.js";
import { forgetPassModel } from "../models/user.forgetPass.model.js";
import { sendMessage } from "../utils/MobileMessageSender.js";
import { updateEmailOtpModel } from "../models/updateEmailOtp.model.js";
import { DateModel } from "../models/date.model.js";


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

//for masking email
const maskEmail = (email) => {
    const atIndex = email.indexOf("@");
    const localPart = email.substring(0, atIndex);
    const maskedLocalPart = "*".repeat(localPart.length - 3) + localPart.slice(-3);
    const domain = email.substring(atIndex); // Keep the domain part as it is

    return maskedLocalPart + domain;
}

const maskMobile = (mobile) => {
    return "*".repeat(7) + mobile.toString().slice(-3);
}

const userDetails = async (usernameOrEmailOrMobile) => {

    //checking if field is string->username or email
    if (typeof usernameOrEmailOrMobile === "string") {
        return await userModel.findOne({ $or: [{ username: usernameOrEmailOrMobile }, { email: usernameOrEmailOrMobile }] });
    } else {

        //field is number means it is mobile
        return await userModel.findOne({ mobile: usernameOrEmailOrMobile });
        // usernameOrEmailOrMobile = usernameOrEmailOrMobile.toString();
    }
}

const generateOTP = (length = 6) => {
    return Randomstring.generate({
        length: length,
        charset: "numeric"
    });
}

//for generating otp and hashed otp
const generateOTPs = async () => {
    //creating the OTP
    const OTP = Randomstring.generate({
        length: 6,
        charset: "numeric"
    });

    //hashing the otp
    const hashedOTP = await bcrypt.hash(OTP, 10);

    return { OTP, hashedOTP };
}

const saveOTPs = async (modelName, model, email) => {
    const doesExist = await modelName.findOne({email});

    if (!doesExist) {
        const otp = model;
        await otp.save();
    } else {
        const hashedOtp=await bcrypt.hash(model.otp,10);
        await modelName.findOneAndUpdate({email}, {$set:{otp:hashedOtp}});
    }
}

const saveForgetPassOTPs = async (user, hashedOTP) => {

    //saving the email,mobile and otps to database
    const doesExist = await forgetPassModel.findOne({ email: user.email });

    if (!doesExist) {
        const otp = new forgetPassModel({
            email: user.email,
            otp: hashedOTP
        });

        await otp.save();
    } else {
        await forgetPassModel.findOneAndUpdate({ email: user.email }, { otp: hashedOTP });
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
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

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

    //check if the given mobile number already exist or not
    const isUserExist = await userModel.findOne({mobile});
    if(isUserExist){
        throw createError.Conflict("Mobile number already registered");
    }

    //creating the email and mobile OTPs 
    const emailOTP = Randomstring.generate({
        length: 6,
        charset: "numeric"
    });

    const mobileOTP = Randomstring.generate({
        length: 6,
        charset: "numeric"
    });


    // console.log(emailOTP, mobileOTP);

    //saving the email,mobile and otps to database
    const doesExist = await otpModel.findOne({ email });
    if (!doesExist) {
        const otp = new otpModel({
            email: email,
            mobile: mobile,
            emailOTP: emailOTP,
            mobileOTP: mobileOTP
        });

        await otp.save();
    } else {
        /*The $set operator is used to update the values of specific fields
         in a document without affecting other fields. 
         If you omit $set, the entire document will be replaced with the update object, 
         and Only the fields explicitly provided in the update object will be present 
         in the updated document*/
        /* mongoose findOneAndUpdate doesn't invoke pre() and post() function. */

        const hashedMobileOtp=await bcrypt.hash(mobileOTP,10);
        const hashedEmailOtp=await bcrypt.hash(emailOTP,10);
        await otpModel.findOneAndUpdate({ email }, { $set: { emailOTP: hashedEmailOtp, mobileOTP: hashedMobileOtp } });
    }

    //creating the otp email
    const subject = "ShareSphere Email OTP Verification";
    const emailMessage = `The email verification OTP code is ${emailOTP}`;

    //sending the otps
    await sendEmail(email, subject, emailMessage);

    //creating and sending the mobile otp message using twilio
    const mobileMessage = `OTP for your ShareSphere Application is ${mobileOTP}`
    await sendMessage(mobile, mobileMessage);

    return res.status(200).json(new ApiResponse(200, {}, "OTP Sent Successfully"));


});

const verifyOTP = asyncHandler(async (req, res) => {

    const { emailOTP, mobileOTP } = req.body;

    const userOTP = await otpModel.findOne({ email: req.user.email });

    //either user is not applied for verification yet or it is already verified
    if (!userOTP) throw createError.BadRequest("Send OTP Request");

    const isEmailVerified = await bcrypt.compare(emailOTP.toString(), userOTP.emailOTP);
    const isMobileVerified = await bcrypt.compare(mobileOTP.toString(), userOTP.mobileOTP);

    if (!isEmailVerified || !isMobileVerified) throw createError.Conflict("Invalid OTP");

    const updatedUser = await userModel.findOneAndUpdate({ email: req.user.email }, { $set: { isVerified: true, mobile: userOTP.mobile } }, { new: true }).select("-password -refreshToken");

    //delete the otps from database
    await otpModel.findOneAndDelete({ email: req.user.email });

    return res.status(200).json(new ApiResponse(200, updatedUser, "OTP Verified Successfully"));

});

const details = asyncHandler(async (req, res) => {

    //checks validation if failed then throws error else saves the details to result
    const result = await joiDetailsSchema.validateAsync(req.body).catch(error => { throw createError.BadRequest(error.details[0].message) });

    const file = req.file;
    const fileURI = getDataUri(file)

    if (!fileURI) {
        throw createError.NotFound("Avatar Not Found");
    }

    const avatar = await uploadOnCloudinary(fileURI.content);

    if (!avatar) {
        //didn't upload on cloudinary
        throw createError.InternalServerError();
    }

    //using spread operator for efficiency
    const user = await userModel.findOneAndUpdate({ email: req.user.email },
        { $set: { ...result, avatar: avatar.url, isDetailsFilled: true } },
        { new: true }).select("-password -refreshToken");

    //if user doesn't exist, then asynchanler will automatically generate internal server error

    return res.status(200).json(new ApiResponse(200, user, "Avatar Uploaded Successfully"));

});

const forgetPassDetails = asyncHandler(async (req, res) => {

    const usernameOrEmailOrMobile = req.body.usernameOrEmailOrMobile;

    await joiForgetPassDetails.validateAsync(req.body).catch(error => { throw createError.BadRequest(error.details[0].message) });

    const user = await userDetails(usernameOrEmailOrMobile);

    if (!user) {
        throw createError.NotFound("User Not Found");
    }


    //check if mobile field is present or not
    if (!user.mobile) {
        const email = maskEmail(user.email);

        const response = {
            usernameOrEmailOrMobile,
            email,
            mobile: "",
            isEmail: true,
            isMobile: false

        }
        return res.status(200).json(new ApiResponse(200, response));
    }

    //if mobile feild is also present
    const email = maskEmail(user.email);
    const mobile = maskMobile(user.mobile);

    const response = {
        usernameOrEmailOrMobile,
        email,
        mobile: mobile,
        isEmail: true,
        isMobile: true

    }

    return res.status(200).json(new ApiResponse(200, response));

});

const sendForgetPassOTP = asyncHandler(async (req, res) => {

    const { usernameOrEmailOrMobile, isEmail = false, isMobile = false } = req.body;

    await joiSendForgetPassOTP.validateAsync(req.body).catch(error => { throw createError.BadRequest(error.details[0].message) });

    const user = await userDetails(usernameOrEmailOrMobile);

    if (!user) {
        throw createError.NotFound("User Not Found");
    }

    if (isEmail == false && isMobile == false) {
        throw createError.BadRequest("Please Select Email or Mobile");
    }

    //otps
    const { OTP, hashedOTP } = await generateOTPs();

    //user wants to send otp on email
    if (isEmail) {

        //saving forget password otps
        await saveForgetPassOTPs(user, hashedOTP);

        //creating the otp email
        const subject = "ShareSphere Forget Password OTP Verification";
        const emailMessage = `The Forget Password OTP code is ${OTP}`;

        //sending the otps
        await sendEmail(user.email, subject, emailMessage);

        return res.status(200).json(new ApiResponse(200, "OTP Sent to Email Successfully"));

    }
    else if (isMobile) {
        console.log("mobile verification");
    }


});

const forgetPassVerify = asyncHandler(async (req, res) => {

    const { usernameOrEmailOrMobile, otp, password } = req.body;

    await joiForgetPassVerify.validateAsync(req.body).catch(error => { throw createError.BadRequest(error.details[0].message) });

    const user = await userDetails(usernameOrEmailOrMobile);

    if (!user) {
        throw createError.NotFound("User Not Found");
    }

    const userOTP = await forgetPassModel.findOne({ email: user.email });

    //either user is not applied for verification yet or it is already verified
    if (!userOTP) throw createError.BadRequest("Send OTP Request");

    const isOtpVerified = await bcrypt.compare(otp.toString(), userOTP.otp);

    if (!isOtpVerified) throw createError.Conflict("Invalid OTP");

    //password will be automatically hashed using pre function
    user.password = password;
    user.save()

    //delete the otps from database
    await forgetPassModel.findOneAndDelete({ email: user.email });

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));

});

const isUsernameAvailable = asyncHandler(async (req, res) => {
    await joiIsUsernameAvailable.validateAsync(req.params).catch(error => { throw createError.BadRequest(error.details[0].message) });
    const user = await userModel.findOne({ username: req.params.username });
    if (!user) {
        return res.status(200).json(new ApiResponse(200, { "available": true }, "Username Available"));
    }
    return res.status(200).json(new ApiResponse(200, { "available": false }, "Username Not Available"));

});

//update constrolers
const updateDetails = asyncHandler(async (req, res) => {

    const result = await joiUpdateDetails.validateAsync(req.body).catch(err => { throw createError.BadRequest(err.details[0].message) });

    const updatedUser = findOneAndUpdate({ email: req.user.email }, { $set: { result } }, { new: true }).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200, updatedUser, "Details Updated successfully"));
});

const updateAvatarBio = asyncHandler(async (req, res) => {

    const result = await joiUpdateAvatarBio.validateAsync(req.body()).catch(err => { throw createError.BadRequest(err.details[0].message) });

    const file = req.file;
    const fileURI = getDataUri(file)

    if (!fileURI) {
        throw createError.NotFound("Avatar Not Found");
    }

    const avatar = await uploadOnCloudinary(fileURI.content);

    if (!avatar) {
        //didn't upload on cloudinary
        throw createError.InternalServerError();
    }

    //using spread operator for efficiency
    const updatedUser = await userModel.findByIdAndUpdate(req.user._id,
        { $set: { ...result, avatar: avatar.url } },
        { new: true }).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200, updatedUser, "Updated Successfully"));

});

const updateUsername = asyncHandler(async (req, res) => {

    const result = await joiUpdateUsername.validateAsync(req.body).catch(err => { throw createError.BadRequest(err.details[0].message) });

    const user = await userModel.findOne({ username: result.username });
    if (user) {
        throw createError.Conflict("Username already taken");
    }

    const updatedUser = await userModel.findByIdAndUpdate(req.user._id, { $set: { username: result.username } }, { new: true }).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200, updatedUser, "username updated succesfully"));

});

const updateEmailSendOtp = asyncHandler(async (req, res) => {

    const result = await joiUpdateEmailSendOtp.validateAsync(req.body).catch(err => { throw createError.BadRequest(err.details[0].message) })

    const user = await userModel.findOne({ email: result.newEmail });
    if (user) {
        throw createError.Conflict("Email already taken");
    }

    const OTP = generateOTP();

    const message = `OTP for Email updation is ${OTP}`;
    const subject = "ShareSphere Email Updation OTP";

    //sending the email
    await sendEmail(result.newEmail, subject, message);

    //email sent successfully then saving OTP to database
    const model = new updateEmailOtpModel({
        newEmail: result.newEmail,
        email: req.user.email,
        otp: OTP
    });
    await saveOTPs(updateEmailOtpModel, model, req.user.email);

    return res.status(200).json(new ApiResponse(200, {}, "OTP Sent Successfully"));

});

const updateEmailVerifyOtp = asyncHandler(async (req, res) => {

    await joiUpdateEmailVerifyOtp.validateAsync(req.body).catch(err => { throw createError.BadRequest(err.details[0].message) });

    console.log(req.user._id);

    const existingUser = await updateEmailOtpModel.findOne({email:req.user.email});

    if (!existingUser) {
        throw createError.NotFound("Send OTP Request");
    }

    const isOtpVerified = await bcrypt.compare(req.body.otp.toString(), existingUser.otp);

    if (!isOtpVerified) {
        throw createError.Conflict("Invalid OTP");
    }

    const updatedUser = await userModel.findByIdAndUpdate(req.user._id, { email: existingUser.newEmail }, { new: true }).select("-password -refreshToken");

    //deleting the otp from database
    await existingUser.deleteOne({ email: req.user.email });

    res.status(200).json(new ApiResponse(200, updatedUser, "Email Updated Successfully"));
})

const updateMobile = asyncHandler(async (req, res) => {

});

const saveDate=asyncHandler(async(req,res)=>{
    const valid=await joiDate.validateAsync(req.body).catch(err=>{throw createError.BadRequest(err.details[0].message)});
    const a=Date("1970-01-01T00:00:00.000Z")
    await DateModel.create({date:valid.date}).then((err,result)=>{
        if(err){
            console.error(err);
        }
        else{
            console.log(result)
           return res.status(200).json(new ApiResponse(200,{}, "Date saved to MongoDB"));
        }
    });
});


export { signup, signin, logout, refreshAccessToken, sendOTP, verifyOTP, details, forgetPassDetails, sendForgetPassOTP, forgetPassVerify, isUsernameAvailable, updateDetails, updateAvatarBio, updateEmailSendOtp, updateMobile, updateUsername, updateEmailVerifyOtp,saveDate };
//use pre function for hashing of otps

