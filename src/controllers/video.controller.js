import { Video } from "../models/video.model.js";
import { apiError } from "../utils/api-error.js";
import { apiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";




export const getVideoandThumbnail = asyncHandler(async(req,res)=>{

    const {title,description} = req.body

    if (!(title || description)) {
        throw new apiError(401,"Fields are mandatory")
    }


    const videoFileLocalPath = req.files?.videoFile[0]?.path
    console.log(videoFileLocalPath)
    const thumbnailFileLocalPath = req.files?.thumbnail[0]?.path

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath)

    if (!videoFile) {
        throw new apiError(404,"Couldn't upload video to cloudinary")
    }
    if (!thumbnail) {
        throw new apiError(404,"Couldn't upload Thumbnail to cloudinary")
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url
    })

    const createdVideo = await Video.findById(video?._id).select("-videoFile -description")

    if (!createdVideo) {
        throw new apiError(400,"Couldn't upload the video")
    }

    res.status(200)
    .json(
        new apiResponse(200,createdVideo,"Video Uploaded Successfully")
    )

})