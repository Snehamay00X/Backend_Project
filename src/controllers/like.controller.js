import { Like } from "../models/like.model.js";
import { apiError } from "../utils/api-error.js";
import { apiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import {Comment} from "../models/comment.model.js"



// like unlike logic 
export const likeVideo = asyncHandler(async(req,res)=>{
    const {videoID} = req.params
    const UserID = req.user._id

    const videoExists = await Video.findById(videoID)

    if (!videoExists) {
        throw new apiError(404,"No video exists in this VideoID")
    }

    const existingLike = await Like.findOne(
        {
            video: videoID,
            likedBy: UserID
        }
    )

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(
            new apiResponse(200,{},"Like removed successfully")
        )
    }

    const like = await Like.create(
        {
            video: videoID,
            likedBy: UserID
        }
    )

    res.status(201)
    .json(
        new apiResponse(201,like,"Liked the video")
    )

})


export const likeComment = asyncHandler(async (req, res) => {
    const { commentID } = req.params;
    const userID = req.user._id;

    const commentExists = await Comment.findById(commentID);

    if (!commentExists) {
        throw new apiError(404, "No comment exists with this ID");
    }

    // Check if user already liked this comment
    const existingLike = await Like.findOne({
        comment: commentID,
        likedBy: userID,
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);

        return res.status(200).json(
            new apiResponse(200, {}, "Comment like removed successfully")
        );
    }

    // Create a new like
    const like = await Like.create({
        comment: commentID,
        likedBy: userID,
    });

    return res.status(201).json(
        new apiResponse(201, like, "Comment liked successfully")
    );
});

