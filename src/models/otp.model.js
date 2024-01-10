import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email:{
        type: String,
        unique: true,
        required: true,
        index: true
    },
    mobile: {
        type: Number,
        required:true,
        trim: true
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

export const otpModel = mongoose.model("Otp", otpSchema);