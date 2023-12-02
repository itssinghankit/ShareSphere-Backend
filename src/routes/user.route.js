import { Router } from "express";

// import { upload } from "../middlewares/multer.middleware.js";
import { signin, signup } from "../controllers/user.controller.js";

const userRouter=Router();

userRouter.post("/signup",signup);
userRouter.post("/signin",signin);

    // upload[{name:"avatar",maxCount:1}]).fields(),
export default userRouter;