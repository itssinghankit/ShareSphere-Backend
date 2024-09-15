import { Router } from "express";
import { getAllMessages, sendMessage } from "../../controllers/chat/message.controller.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";

const messageRouter = Router()

messageRouter.get("/", (req, res) => {
    res.json({ message: "Hello from message route" });
});

messageRouter.post("/send/:chatId",verifyJWT,sendMessage)
messageRouter.get("/get-all-messages/:chatId",verifyJWT,getAllMessages)

export default messageRouter