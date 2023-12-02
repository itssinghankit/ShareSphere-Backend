import { Router } from "express";

// import { upload } from "../middlewares/multer.middleware.js";
import { signup } from "../controllers/user.controller.js";

const userRouter=Router();

userRouter.post("/signup",signup)

    // upload[{name:"avatar",maxCount:1}]).fields(),
export default userRouter;