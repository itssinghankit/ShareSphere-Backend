import { NotificationTypes } from "../../constants/notificationTypes.js";
import mongoose from "mongoose";

const notificationSchema =new mongoose.Schema({
    interactorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    interactorName:{
        type:String,
        required:true
    },
    interactorAvatar:{
        type:String,
        required:true
    },
    interactorUsername:{
        type:String,
        required:true
    },
    receiverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    postId:{  //post may present in notification or may not for eg in case of follow notification
        type: mongoose.Schema.Types.ObjectId,
        ref:"Post"
    },
    postCover:{
        type:String
    },
    category:{
        type:String,
        enum:Object.values(NotificationTypes),
        default:NotificationTypes.GENERAL
    },
    isRead:{
        type:Boolean,
        default:false
    }
},
{ timestamps: true })

export default mongoose.model("Notification",notificationSchema)

