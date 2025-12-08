import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { apiError } from "../utils/api-error.js";
import { apiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary,getVideoDuration, deleteFromCloudinary } from "../utils/cloudinary.js";




export const getVideoandThumbnail = asyncHandler(async(req,res)=>{

    const {title,description} = req.body

    if (!title || !description) {
        throw new apiError(401,"Fields are mandatory")
    }

    const videoFileLocalPath = req.files?.videoFile[0].path
    const thumbnailFileLocalPath = req.files?.thumbnail[0]?.path

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath)

    if (!videoFile) {
        throw new apiError(404,"Couldn't upload video to cloudinary")
    }
    if (!thumbnail) {
        throw new apiError(404,"Couldn't upload Thumbnail to cloudinary")
    }

    const videoDuration = await getVideoDuration(videoFile.url)
    

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        owner: req.user._id,
        duration: videoDuration,
        isPublished:false
    })

    const createdVideo = await Video.findById(video?._id)

    if (!createdVideo) {
        throw new apiError(400,"Couldn't upload the video")
    }

    res.status(200)
    .json(
        new apiResponse(200,createdVideo,"Video Uploaded Successfully")
    )

})

export const publishVideo = asyncHandler(async(req,res)=>{
    const videoIds = req.body.ids//// here I'm expecting a json obj with the key of "ids" and an array with video ids

    if (!videoIds || videoIds.length == 0) {
        throw new apiError(400,"No videos to be published")
    }

   const uploadedVideo = await Video.updateMany(
  { _id: { $in: videoIds }, owner: req.user._id },
  { $set: { isPublished: true, publishedAt: new Date() } }
  );

    res.status(200)
    .json(
    new apiResponse(200,{
        requested: videoIds.length,
        successfull: uploadedVideo.modifiedCount
    },"Videos Uploaded Successfully")
)

})

export const updateVideoDescription = asyncHandler(async(req,res)=>{
    const {title,description} = req.body
    const {videoID} = req.params
    
    if ([title,description].some((field)=>{
        return field?.trim() === ""
    })) {
        throw new apiError(400,"Feilds shouldn't be empty")
    }

//    if (
//     (!title || title.trim() === "") &&
//     (!description || description.trim() === "")
//     ) {
//     throw new apiError(400, "Fields shouldn't be blank");
//     }

    if (!videoID) {
        throw new apiError(404,"Please send video Id")
    }
    const video = await Video.findById(videoID)

    if (!video) {
        throw new apiError(404,"Video not found")
    }
    if (!(video.owner.toString() == req.user._id.toString())) {
        throw new apiError(404,"Unauthorized access")
    }
    const updatedVideo = await Video.findByIdAndUpdate(videoID,
        {
           $set:{
                title,
                description
           }
        },
        {
            new:true
        }
    )

    res.status(200)
    .json(
        new apiResponse(200,updatedVideo,"Video Title and description updated successfully")
    )
   
})

export const replaceVideo = asyncHandler(async(req,res)=>{

    const {videoID} = req.params

    const oldVideo = await Video.findById(videoID)

    if (!oldVideo) {
        throw new apiError(404,"Couldn't find the video")
    }

    const videoFileLocalPath = req.file?.path

    if (!videoFileLocalPath) {
        throw new apiError(400,"No Video found")
    }
    if (!(oldVideo.owner.toString() === req.user._id.toString())) {
        throw new apiError(403,"You're not authorized")
    }
    
    const uploadedVideo = await uploadOnCloudinary(videoFileLocalPath)
    
    if (!uploadedVideo) {
        throw new apiError(400,"Couldn't upload file to cloudinary")
    }
    
    const deletedVideo = await deleteFromCloudinary(oldVideo.videoFile)

    if (!deletedVideo) {
        throw new apiError(500,"Couldn't delete the video")
        //console.log("Couldn't delete the Video")
    }
    
    await Video.findByIdAndUpdate(videoID,{
        $set:{
            videoFile: uploadedVideo.url
        }},
        {
            new: true
        }
    )

    res.status(200)
    .json(
        new apiResponse(200,uploadedVideo.url,"Video replaced successfully")
    )
})

export const updateThumbnail = asyncHandler(async(req,res)=>{
    const {videoID} = req.params/// I'm expecting videoId

    const oldVideo = await Video.findById(videoID)

    if (!oldVideo) {
        throw new apiError(404,"Couldn't find the video")
    }

    const thumbnailLocalPath = req.file?.path

    if (!thumbnailLocalPath) {
        throw new apiError(400,"No Thumbnail found")
    }
    if (!(oldVideo.owner.toString() === req.user._id.toString())) {
        throw new apiError(403,"You're not authorized")
    }

    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!uploadedThumbnail) {
        throw new apiError(400,"Couldn't upload file to cloudinary")
    }

    const deletedThumbnail = await deleteFromCloudinary(oldVideo.thumbnail)

    if (!deletedThumbnail) {
        console.log("Couldn't delete the Thumbnail")
    }

    await Video.findByIdAndUpdate(videoID,{
        $set:{
            thumbnail: uploadedThumbnail.url
        }},
        {
            new: true
        }
    )

    res.status(200)
    .json(
        new apiResponse(200,uploadedThumbnail.url,"Thumbnail updated successfully")
    )
})

export const deleteVideo = asyncHandler(async(req,res)=>{
    const {videoID} = req.params

    const oldVideo = await Video.findById(videoID)

    if (!oldVideo) {
        throw new apiError(404,"Couldn't find the video")
    }

    if (!(oldVideo.owner.toString() === req.user._id.toString())) {
        throw new apiError(403,"You're not authorized")
    }

    
    const deletedVideo = await deleteFromCloudinary(oldVideo.videoFile)
    const deletedThumbnail = await deleteFromCloudinary(oldVideo.thumbnail)
    
    if (!deletedVideo || !deletedThumbnail) {
       console.warn("Couldn't delete the Video from cloudinary")
    }
    
    await Video.findByIdAndDelete(videoID)

    res.status(200)
    .json(
        new apiResponse(200,{},"Video Deleted successfully")
    )
})

//// get a single video document
export const getVideoInfo = asyncHandler(async(req,res)=>{
    const {videoID} = req.params//// expecting an "id" in url

    const video = await Video.findById(videoID)

    if (!video) {
        throw new apiError(404,"Couldn't find the video")
    }

    res.status(200)
    .json(
        new apiResponse(200,video,"Successfully fetched Video")
    )
})

//// add watched videos to users watchHistory
export const addToWatchHistory = asyncHandler(async(req,res)=>{ 
    const {videoID} = req.params
    const currentUser = await User.findByIdAndUpdate(req.user._id,
        {
            $addToSet:{
                watchHistory: videoID
            }
        },
        {
            new: true
        }
    )

    res.status(200)
    .json(
        new apiResponse(200,currentUser.watchHistory,"Video watched and added to watch history")
    )
    
})

