import mongoose from "mongoose";
import bcrypt from "bcrypt";

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

otpSchema.pre("save", async function (next) {
   this.mobileOTP=await bcrypt.hash(this.mobileOTP,10);
   this.emailOTP=await bcrypt.hash(this.emailOTP,10);
    next();
});

export const otpModel = mongoose.model("Otp", otpSchema);