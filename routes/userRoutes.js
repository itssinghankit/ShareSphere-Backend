const express = require("express");
const userRouter = express.Router();
const {signup,signin}=require("../controllers/userController.js");

// module.import {  } from "module";

userRouter.post("/signup",signup);

userRouter.post("/signin",signin);

module.exports=userRouter;