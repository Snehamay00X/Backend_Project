import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addComment,
    deleteComment,
    editComment,
    getComment
} from "../controllers/comment.controller.js";

const router = Router();

// All comment routes require authentication
router.use(verifyJWT);

// Add a comment to a video
router.post("/:videoID", addComment);

// Get all comments on a video
router.get("/:videoID", getComment);

// Edit a comment
router.patch("/:commentID", editComment);

// Delete a comment
router.delete("/:commentID", deleteComment);

export default router;