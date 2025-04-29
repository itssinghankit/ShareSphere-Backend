import createHttpError from "http-errors";
import { joiSaveFcmToken } from "../../helpers/notificationValidationSchema.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import fcmtokenModel from "../../models/notification/fcmtoken.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";


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

export {saveFcmToken}