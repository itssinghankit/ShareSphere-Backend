import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { saveFcmToken } from "../../controllers/notification/notification.controller.js";

const notificationRouter = Router();

notificationRouter.get("/", (req, res) => {
    res.json({ message: "Hello from notification route" });
});

notificationRouter.post("/create-or-update-token",verifyJWT,saveFcmToken)

export default notificationRouter;