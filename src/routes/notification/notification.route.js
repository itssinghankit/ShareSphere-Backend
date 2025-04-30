import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { getAllNotification, saveFcmToken, sendNotificationCheck } from "../../controllers/notification/notification.controller.js";

const notificationRouter = Router();

notificationRouter.get("/", (req, res) => {
    res.json({ message: "Hello from notification route" });
});

notificationRouter.post("/create-or-update-token",verifyJWT,saveFcmToken)
notificationRouter.post("/send-notification-check",sendNotificationCheck)
notificationRouter.get("/get-all-notification",verifyJWT,getAllNotification)

export default notificationRouter;