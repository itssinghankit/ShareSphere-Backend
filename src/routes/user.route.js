import { Router } from "express";

// import { upload } from "../middlewares/multer.middleware.js";
import { signup } from "../controllers/user.controller.js";

const userRouter=Router();

userRouter.route("/signup").post((req,res)=>signup);
    // upload[{name:"avatar",maxCount:1}]).fields(),
export default userRouter;