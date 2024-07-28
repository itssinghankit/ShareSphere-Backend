import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { getAllPosts, getMyPosts, likePost, savePost } from "../controllers/post.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const postRouter = Router();

postRouter.get("/", (req, res) => {
    res.json({ message: "Hello from posting route" });
});

postRouter.post("/save-post", verifyJWT, upload.array("postImages", 10), savePost)

postRouter.get("/get-all-posts", verifyJWT, getAllPosts)
postRouter.get("/get-my-posts",verifyJWT,getMyPosts)

//for likes
postRouter.post("/like-post/:postId",verifyJWT,likePost)

export default postRouter;