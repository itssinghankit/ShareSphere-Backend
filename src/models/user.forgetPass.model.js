import mongoose from "mongoose";

const forgetPassSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    otp:{
        type:String,
        required:true
    }
});

export const forgetPassModel = mongoose.model("ForgetPassOtp", forgetPassSchema);