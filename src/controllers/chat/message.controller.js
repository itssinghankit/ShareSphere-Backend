import createHttpError from "http-errors"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { chatModel } from "../../models/chat/chat.model.js"
import { chatMessageModel } from "../../models/chat/message.model.js"
import { emitSocketEvent } from "../../socket/index.js";
import { ChatEventEnum } from "../../constants.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import mongoose from "mongoose";

//helper function to convert string to object id
const toObjectId = (id) => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;

const chatMessageCommonAggregation = () => {
    return [
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "sender",
                as: "sender",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            email: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                sender: { $first: "$sender" },
            },
        },
    ]
}

const getAllMessages = asyncHandler(async (req, res) => {
    const { chatId } = req.params

    //checking if chat exist or not
    const selectedChat = await chatModel.findById(chatId)

    if (!selectedChat) {
        throw createHttpError.NotFound("Chat does not exist")
    }

    //only sending messaged if he is part of that chat otherwise anyone can see chats of anyone
    if (!selectedChat.participants?.includes(req.user._id)) {
        throw createHttpError.BadRequest("You are not part of this chat")
    }

    const messages = await chatMessageModel.aggregate([
        {
          $match: {
            chat:toObjectId(chatId),
          },
        },
        ...chatMessageCommonAggregation(),
        {
          $sort: {
            createdAt: -1,
          },
        },
      ]);

    return res.status(200).json(new ApiResponse(200, messages || [], "Messages fetched successfully"))

})

const sendMessage = asyncHandler(async (req, res) => {
    //TODO do validation of chatID
    const { chatId } = req.params
    const { content } = req.body

    //if he doesn't send content or attachment send error
    if (!content && req.files?.attachments?.length) {
        throw createHttpError.BadRequest("Message content or attachment is required")
    }

    //check if chat exists
    const selectedChat = await chatModel.findById(chatId)

    if (!selectedChat) {
        throw createHttpError.NotFound("Chat does not exist")
    }

    const attachmentFiles = []
    if (req.files?.attachments?.length) {
        //handle cloudinary uploadation
    }

    //creating a new message 
    const message = await chatMessageModel.create({
        sender: toObjectId(req.user._id),
        content: content || "",
        chat: toObjectId(chatId),
        attachments: attachmentFiles
    })

    //update chat's last message
    const chat = await chatModel.findByIdAndUpdate(
        chatId,
        {
            $set: {
                lastMessage: message._id
            }
        },
        { new: true }
    )

    //structuring the message
    const messages = await chatMessageModel.aggregate([
        {
            $match: {
                _id: toObjectId(message._id)
            }

        },
        ...chatMessageCommonAggregation()
    ])

    //storing the received message
    const receivedMessage = messages[0]

    if (!receivedMessage) {
        throw createHttpError.InternalServerError("Something went wrong")
    }

    //emiting socket event about new message created for participants
    chat.participants.forEach((participantObjectId) => {
        //emit only to recievers
        if (participantObjectId.toString() === req.user._id.toString()) return

        emitSocketEvent(
            req,
            participantObjectId.toString(),
            ChatEventEnum.MESSAGE_RECEIVED_EVENT,
            receivedMessage
        )
    })

    return res.status(201).json(new ApiResponse(201, receivedMessage, "Message saved successfully"))

})

export { sendMessage, getAllMessages }