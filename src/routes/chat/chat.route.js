import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { createOrGetAOneOnOneChat, getAllChats ,showMessageFriends} from "../../controllers/chat/chat.controller.js";

const chatRouter = Router();

chatRouter.get("/", (req, res) => {
    res.json({ message: "Hello from chat route" });
});

chatRouter.get("/show-message-friends", verifyJWT, showMessageFriends)
chatRouter.post("/oneone/:receiverId",verifyJWT,createOrGetAOneOnOneChat)
chatRouter.get("/all",verifyJWT,getAllChats)

export default chatRouter;