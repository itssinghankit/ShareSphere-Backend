import mongoose from "mongoose";

const forgetPassSchema = new mongoose.Schema({
    usernameOrEmailOrMobile: {
        type: {$or: [String, Number]},
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    isEmail: {
        type:Boolean,
        required: true
    },
    isMobile: {
        type:Boolean,
        required:true
    },
    emailOTP:{
        type:String,
        required:true
    },
    mobileOTP:{
        type:String,
        required:true
    }
});

export const forgetPassModel = mongoose.model("ForgetPass", forgetPassSchema);