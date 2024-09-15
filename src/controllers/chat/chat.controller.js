import followModel from "../../models/follow.model.js"
import { ApiResponse } from "../../utils/ApiResponse.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { userModel } from "../../models/user.model.js";
import createHttpError from "http-errors";
import { chatModel } from "../../models/chat/chat.model.js";
import { emitSocketEvent } from "../../socket/index.js";
import { ChatEventEnum } from "../../constants.js";
import mongoose from "mongoose";

//helper function to convert string to object id
const toObjectId = (id) => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;

//common aggregation pipelinne which is reused in many controllers
const chatCommonAggregation = () => {
    return [
        {
            // lookup for the participants present
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "participants",
                as: "participants",
                pipeline: [
                    {
                        $project: {
                            password: 0,
                            refreshToken: 0,
                            isVerified: 0,
                            isDetailsFilled: 0,
                        },
                    },
                ],
            },
        },
        {
            // lookup for the group chats
            $lookup: {
                from: "chatmessages",
                foreignField: "_id",
                localField: "lastMessage",
                as: "lastMessage",
                pipeline: [
                    {
                        // get details of the sender
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
                ],
            },
        },
        {
            $addFields: {
                lastMessage: { $first: "$lastMessage" },
            },
        },
    ];
};

const showMessageFriends = asyncHandler(async (req, res) => {
    const userId = req.user._id

    //fetching its friends - to which he follows
    const friends = await followModel.find({ followerId: userId }).populate("accountId", "_id username fullName avatar isOnline").select("accountId")

    return res.status(200).json(new ApiResponse(200, friends, "These are your friends"))

})

const createOrGetAOneOnOneChat = asyncHandler(async (req, res) => {
    //TODO:validate receiverId as mongo id

    const { receiverId } = req.params;

    //check if receiver is valid or not
    const receiver = await userModel.findById(receiverId)

    if (!receiver) {
        throw createHttpError.NotFound("Reciever does not exist")
    }

    //checking if we sender and reciever is not same person
    if (receiver._id.toString() === req.user._id.toString()) {
        throw createHttpError.BadRequest("You can't chat with yourself")
    }

    const chats = await chatModel.aggregate([
        {
            $match: {
                //only one on one chat
                isGroupChat: false,

                //checking if chat is between sender and receiver only
                $and: [
                    { participants: { $elemMatch: { $eq: req.user._id } } },
                    { participants: { $elemMatch: { $eq: toObjectId(receiverId) } } }
                ]
            }
        },
        ...chatCommonAggregation()
    ])

    if (chats.length) {
        //if the user has already created a chat means it has some previous chats present
        return res.status(200).json(new ApiResponse(200, chats[0], "Chat retrieved successfully"))
    }

    //if not we need to create a new one on one chat
    const newChat = await chatModel.create({
        name: "One on One Chat",
        participants: [req.user._id, toObjectId(receiverId)],
        admin: req.user._id
    })

    const createdChat = await chatModel.aggregate([
        {
            $match: {
                _id: newChat._id
            }
        },
        ...chatCommonAggregation()
    ])

    const payload = createdChat[0] //storing aggregation result

    if (!payload) {
        throw createHttpError.InternalServerError("Error while creating chat")
    }

    //emit socket event about new chat added to the participants
    payload?.participants?.forEach((participant) => {
        if (participant._id.toString() === req.user._id.toString()) return;

        //sending event to the reciever only
        emitSocketEvent(
            req,
            participant._id.toString(),
            ChatEventEnum.NEW_CHAT_EVENT,
            payload
        )
    })

    return res.status(201).json(new ApiResponse(201, payload, "Chat retrieved successfully"))

})

const getAllChats = asyncHandler(async (req, res) => {
    const chats = await chatModel.aggregate([
      {
        $match: {
          participants: { $elemMatch: { $eq: req.user._id } }, // get all chats that have logged in user as a participant
        },
      },
      {
        $sort: {
          updatedAt: -1,
        },
      },
      ...chatCommonAggregation(),
    ]);
  
    return res
      .status(200)
      .json(
        new ApiResponse(200, chats || [], "User chats fetched successfully!")
      );
  });

export { showMessageFriends, createOrGetAOneOnOneChat, getAllChats }