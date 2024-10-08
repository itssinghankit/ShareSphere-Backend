import Joi from "joi";

const joiSignupSchema = Joi.object({
    email: Joi.string().min(1).email().lowercase().required(),
    password: Joi.string().min(8).required(),
    username: Joi.string().min(1).required()
});

//signinValidation for either username or email
const joiSigninSchema = Joi.object({
    usernameOrEmail: Joi.alternatives().try(
        Joi.string().min(1).email().lowercase(),
        Joi.string().min(3).max(30)
    ).required(),
    password: Joi.string().min(8).required(),
});

//details validation
const joiDetailsSchema = Joi.object({
    fullName: Joi.string().min(1).required(),
    gender: Joi.alternatives().try("male", "female", "other").required(),
    dob: Joi.date().required(),
    bio: Joi.string().min(1).required()
});

//forgetPassDetails validation
const joiForgetPassDetails = Joi.object({
    usernameOrEmailOrMobile: Joi.alternatives().try(
        Joi.string().min(1).email().lowercase(),
        Joi.string().min(3).max(30),
        Joi.number().integer().min(1111111111).max(9999999999)
    ).required()
});

//forgetPassSendOTP validation
const joiSendForgetPassOTP = Joi.object({
    usernameOrEmailOrMobile: Joi.alternatives().try(
        Joi.string().min(1).email().lowercase(),
        Joi.string().min(3).max(30),
        Joi.number().integer().min(1111111111).max(9999999999)
    ).required(),
    isEmail: Joi.boolean(),
    isMobile: Joi.boolean()
});

//forgetPassVerify validation
const joiForgetPassVerify = Joi.object({
    usernameOrEmailOrMobile: Joi.alternatives().try(
        Joi.string().min(1).email().lowercase(),
        Joi.string().alphanum().min(3).max(20),
        Joi.number().integer().min(1111111111).max(9999999999)
    ).required(),
    otp: Joi.number().required(),
    password: Joi.string().min(8).required()
});

//UpdateDetails validation
const joiUpdateDetails = Joi.object({
    fullName: Joi.string().min(1).required(),
    dob: Joi.string().min(1).required(),
    gender: Joi.alternatives().try("male", "female", "other").required()
});

//updateAvatarBio validation
const joiUpdateAvatarBio=Joi.object({
    bio:Joi.string().min(1).required()
});

//isUsernameAvailable validation
const joiIsUsernameAvailable = Joi.object({
    username:Joi.string().alphanum().min(3).max(20).required()
});

//joiUpdateUsername validation
const joiUpdateUsername = Joi.object({
    username:Joi.string().alphanum().min(3).max(20).required()
});

//updateEmailSendOtp validation
const joiUpdateEmailSendOtp =Joi.object({
    newEmail:Joi.string().email().lowercase().required()
});

//updateEmailVerifyOtp validation
const joiUpdateEmailVerifyOtp = Joi.object({
    otp:Joi.string().length(6).pattern(/^\d{6}$/).required()
});

const joiDate=Joi.object({
    date:Joi.date().required()
});


//TODO: add lowercase handling
export { joiSignupSchema, joiSigninSchema, joiDetailsSchema, joiForgetPassDetails, joiSendForgetPassOTP, joiForgetPassVerify,joiUpdateDetails, joiUpdateAvatarBio, joiUpdateUsername, joiUpdateEmailSendOtp,joiUpdateEmailVerifyOtp,joiIsUsernameAvailable,joiDate};