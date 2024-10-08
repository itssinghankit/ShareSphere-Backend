import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { details, forgetPassDetails, logout, refreshAccessToken, sendOTP, signin, signup, verifyOTP, sendForgetPassOTP, forgetPassVerify, isUsernameAvailable, updateUsername, updateDetails, updateAvatarBio, updateEmailSendOtp, updateEmailVerifyOtp, saveDate } from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.post("/signup", signup);
userRouter.post("/signin", signin);
userRouter.post("/logout", verifyJWT, logout);
userRouter.post("/refresh-token", refreshAccessToken);
userRouter.get("/check-username/:username", isUsernameAvailable);

//for email otp sending and verification
userRouter.post("/send-otp", verifyJWT, sendOTP);
userRouter.post("/verify-otp", verifyJWT, verifyOTP);

//for saving user details
userRouter.post("/details", verifyJWT, upload.single("avatar"), details);

//for forget password
userRouter.post("/forget-pass-details", forgetPassDetails);
userRouter.post("/send-forget-pass-otp", sendForgetPassOTP);
userRouter.post("/forget-pass-verify", forgetPassVerify);

//update routes
userRouter.patch("/updateDetalils", verifyJWT, updateDetails);
userRouter.patch("/updateAvatarBio", upload.single("avatar"), updateAvatarBio);
userRouter.patch("/update-username", verifyJWT, updateUsername);
userRouter.post("/update-email-send-otp", verifyJWT, updateEmailSendOtp);
userRouter.patch("/update-email-verify-otp", verifyJWT, updateEmailVerifyOtp);

//tutorial
userRouter.post("/date",saveDate);

export default userRouter;