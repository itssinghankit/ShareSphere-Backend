import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    password: {
        type: String,
        required: true
    }
    ,
    fullName: {
        type: String,
        trim: true
    },
    mobile: {
        type: Number,
        trim: true,
        unique: true,
        sparse: true,
        index: true
    },
    gender: {
        type: String,
        lowercase:true
    },
    dob: {
        type: Date
    },
    bio: {
        type: String,
        trim: true,
    },
    avatar: {
        type: String,
    },
    refreshToken: {
        type: String
    },
    isVerified: {
        type: Boolean
    },
    isDetailsFilled: {
        type: Boolean
    },
    isOnline:{
        type:Boolean,
        default:false
    }
},
    { timestamps: true }
)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password,10);
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

//accessToken and refreshToken making are fast process so don't need async await
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        username: this.username,
        email: this.email,
        fullName: this.fullName
    }, process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id
    }, process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY })
}

export const userModel = mongoose.model("User", userSchema);
