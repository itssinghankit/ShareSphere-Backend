import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// import { upload } from "../middlewares/multer.middleware.js";
import { logout, signin, signup } from "../controllers/user.controller.js";

const userRouter=Router();

userRouter.post("/signup",signup);
userRouter.post("/signin",signin);
userRouter.post("/logout",verifyJWT,logout);

    // upload[{name:"avatar",maxCount:1}]).fields(),
export default userRouter;