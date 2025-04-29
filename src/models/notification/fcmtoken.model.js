import { Timestamp } from "mongodb";
import mongoose from "mongoose";

const fcmTokenSchema = new mongoose.Schema({
    token:{
        type:String,
        required:true
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},
{ timestamps: true }
);

export default mongoose.model("FcmToken",fcmTokenSchema);