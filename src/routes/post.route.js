import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { savePost } from "../controllers/post.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const postRouter = Router();

postRouter.get("/", (req, res) => {
    res.json({message:"Hello from posting jj route"});
});

postRouter.post("/save-post", verifyJWT, upload.array("postImages", 10), savePost)

export default postRouter;