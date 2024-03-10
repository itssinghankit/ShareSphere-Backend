import mongoose from "mongoose";
import bcrypt from "bcrypt";

const updateEmailOtpSchema = new mongoose.Schema({

    newEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    }

});

updateEmailOtpSchema.pre("save", async function (next) {
    this.otp = await bcrypt.hash(this.otp, 10);
    next();
});

export const updateEmailOtpModel = mongoose.model("UpdateEmailOtp", updateEmailOtpSchema);


