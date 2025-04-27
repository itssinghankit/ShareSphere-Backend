import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";

const notificationRouter = Router();

notificationRouter.get("/", (req, res) => {
    res.json({ message: "Hello from notification route" });
});

notificationRouter.post("/save-fcm-token",verifyJWT)

export default notificationRouter;