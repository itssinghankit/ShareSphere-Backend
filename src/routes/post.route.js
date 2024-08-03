import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { followAccount, getAllPosts, getMyPosts, likePost, savePost, viewAccount, viewAccountFollowers, viewAccountFollowing } from "../controllers/post.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const postRouter = Router();

postRouter.get("/", (req, res) => {
    res.json({ message: "Hello from posting route" });
});

postRouter.post("/save-post", verifyJWT, upload.array("postImages", 10), savePost)

postRouter.get("/get-all-posts", verifyJWT, getAllPosts)
postRouter.get("/get-my-posts", verifyJWT, getMyPosts)

//for likes
postRouter.post("/like-post/:postId", verifyJWT, likePost)

//follow user
postRouter.post("/follow-account/:accountId", verifyJWT, followAccount)

postRouter.get("/view-account/:accountId", verifyJWT, viewAccount)
postRouter.get("/view-account-followers/:accountId", verifyJWT, viewAccountFollowers)
postRouter.get("/view-account-following/:accountId", verifyJWT, viewAccountFollowing)

export default postRouter;