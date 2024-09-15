import mongoose, { Schema } from "mongoose";

const chatMessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
    },
    attachments: {
      type: [
        {
          url: String,
          localPath: String,
        },
      ],
      default: [],
    },
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
    },
    seenBy: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    }
  },
  { timestamps: true }
);

export const chatMessageModel = mongoose.model("ChatMessage", chatMessageSchema);
