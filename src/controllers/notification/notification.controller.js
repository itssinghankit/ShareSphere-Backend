import createHttpError from "http-errors";
import { joiSaveFcmToken } from "../../helpers/notificationValidationSchema.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import fcmtokenModel from "../../models/notification/fcmtoken.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { userModel } from "../../models/user.model.js";
import admin from "firebase-admin"
import notificationModel from "../../models/notification/notification.model.js";
import postModel from "../../models/post.model.js";
import sendNotification from "../../utils/NotificationSender.js";


const saveFcmToken = asyncHandler(async(req,res)=>{


    const result = await joiSaveFcmToken.validateAsync(req.body).catch((err)=>{throw createHttpError.BadRequest("Token not provided")});
    const userId = req.user.id;

    // Save the token to the database (you need to implement this part)
    // checking if the token already exists in the database

    const user = await fcmtokenModel.findOne({userId});

    if(!user){
        //user not found have to create a new entry
        await fcmtokenModel.create({
            token:result.token,
            userId:userId
        });

        return res.status(200).json(new ApiResponse(200,"Token Saved Successfully","Success"))
    }

    //user found just have to update the token
    await fcmtokenModel.findByIdAndUpdate(user._id,{$set:{token:result.token}});

    // Return a success response
   return res.status(200).json(new ApiResponse(200,"Token Updated Successfully","Success"))

})

const sendNotificationCheck =asyncHandler(async(req,res)=>{
    const {email,title,body} = req.body;

    if(!email || !title || !body){
        throw createHttpError.BadRequest("Email, title and body are required")
    }

    //find the user by email and get the token
    const user = await userModel.findOne({email}).select("_id")

    if(!user){
        throw createHttpError.NotFound("User not found")
    }

    //if user found
    const userToken = await fcmtokenModel.findOne({userId:user._id}).select("token");

    if(!userToken){
        throw createHttpError.NotFound("Token not found")
    }
    const token = userToken.token

    //send notification using firebase admin sdk
    
    //constructing the message first
    const message={
        notification: {
            title: title,
            body: body
          },
          android: {
            notification: {
              imageUrl: 'http://res.cloudinary.com/dey22t5qv/image/upload/v1722159265/ojykcvcszofqh2lthpiu.jp'
            }
          },
        data:{
            title:title,
            body:body
        },
        token:token
    }

    //sending the notification
    await admin.messaging().send(message)

     return res.status(200).json(new ApiResponse(200,"Notification sent successfully","Success"))

})

const saveAndSendNotification = async (interactorId,postId,receiverId,category,token,title,body)=>{

    const interactor= await userModel.findOne({_id:interactorId}).select("_id username fullName avatar")

    if(!interactor){
        throw createHttpError.BadRequest("Notification: Interactor not found in database")
    }

    //if post exist then only save its details
    const post = await postModel.findOne({_id:postId}).select("_id postImages")

    if(!post){
        throw createHttpError.BadRequest("Notification: post not found in database")
    }

    await notificationModel.create({interactorId:interactor._id,interactorName:interactor.fullName,interactorAvatar:interactor.avatar,interactorUsername:interactor.username,receiverId:receiverId,postId:post._id,postCover:post.postImages[0],category:category})

    console.log("notification saved")

    //now send the notification
    //constructing the body
    const finalBody= `${interactor.fullName} (${interactor.username}) ${body}`
    await sendNotification(title,finalBody,post.postImages[0],token)

    console.log("notification sent")

}

export {saveFcmToken,sendNotificationCheck,saveAndSendNotification}