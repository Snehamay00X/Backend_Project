import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { likeVideo, likeComment ,getVideoLikes, getCommentLikes} from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJWT);

// Like / Unlike a Video
router.route("/videos/:videoID/like").post(likeVideo);

// Like / Unlike a Comment
router.route("/comments/:commentID/like").post(likeComment);

router.route("/videos/:videoID/likes").get(getVideoLikes);

router.route("/comments/:commentID/likes").get(getCommentLikes);

export default router;