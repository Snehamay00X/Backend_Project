import { Usercomment } from "../models/comment.model";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/api-error.js";
import { apiResponse } from "../utils/api-response.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";


export const addComment = asyncHandler(async(req,res)=>{
    const {videoID} = req.params
    const userID = req.user._id
    const {comment} = req.body


    const videoExists = await Video.findById(videoID)

    if (!videoExists) {
        throw new apiError(404,"Video doesnt exists")
    }

    if (!comment || comment.trim() == "") {
        throw new apiError(400,"Comment shouldn't be blank")
    }

    //// spam comment prevention

    const commentExists = await Usercomment.findOne({
        content:comment.trim(),
        video:videoID,
        owner:userID
    })

    if (commentExists) {
        throw new apiError(400,"Duplicate message detected")
    }


    const createdComment = await Usercomment.create(
        {
            content: comment.trim(),
            video: videoID,
            owner: userID
        }
    )

    res.status(201)
    .json(
        new apiResponse(201,createdComment,"Comment added")
    )

})

export const deleteComment = asyncHandler(async (req, res) => {
    const { commentID } = req.params;
    const userID = req.user._id;

    // Check if comment exists
    const commentExists = await Usercomment.findById(commentID);

    if (!commentExists) {
        throw new apiError(404, "Comment not found");
    }

    // Only owner can delete
    if (commentExists.owner.toString() !== userID.toString()) {
        throw new apiError(403, "You are not authorized to delete this comment");
    }

    await Usercomment.findByIdAndDelete(commentID);

    return res.status(200).json(
        new apiResponse(200, {}, "Comment deleted successfully")
    );
})

export const editComment = asyncHandler(async (req, res) => {
    const { commentID } = req.params;
    const userID = req.user._id;
    const { newComment } = req.body;

    // Validate new content
    if (!newComment || newComment.trim() === "") {
        throw new apiError(400, "Updated comment cannot be empty");
    }

    // Check if comment exists
    const commentExists = await Usercomment.findById(commentID);

    if (!commentExists) {
        throw new apiError(404, "Comment not found");
    }

    // Only owner can edit
    if (commentExists.owner.toString() !== userID.toString()) {
        throw new apiError(403, "You are not authorized to edit this comment");
    }

    // Prevent same comment update
    if (commentExists.content === newComment.trim()) {
        throw new apiError(409, "No changes detected");
    }

    // Update
    commentExists.content = newComment.trim();
    await commentExists.save();

    return res.status(200).json(
        new apiResponse(200, commentExists, "Comment updated successfully")
    );
})



export const getComment = asyncHandler(async (req, res) => {
    const { videoID } = req.params;
    const userID = req.user._id;

    const comments = await Usercomment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoID)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1 // adjust name based on your schema
                        }
                    }
                ]
            }
        },
        { $unwind: "$ownerDetails" },

        // Count how many likes each comment has
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                totalLikes: { $size: "$likes" },
                isLikedByUser: {
                    $in: [new mongoose.Types.ObjectId(userID), "$likes.likedBy"]
                }
            }
        },
        {
            $project: {
                likes: 0 // remove array to clean response
            }
        },
        {
            $sort: { createdAt: -1 } // latest comments first
        }
    ]);

    return res.status(200).json(
        new apiResponse(200, comments, "All comments fetched")
    );
});