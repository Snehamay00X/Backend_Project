import {Router} from "express"
import { uploadVideo } from "../middlewares/multer.middleware.js"
import { addToWatchHistory, deleteVideo,getVideoandThumbnail, getVideoInfo, publishVideo, replaceVideo, updateThumbnail, updateVideoDescription } from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"


const router = Router()

// router.use(verifyJWT)

// router
//     .route("/")
//     .get(getVideoInfo)
//     .post(uploadVideo.fields(
//         [
//             {
//             name: "videoFile",
//             maxCount:1
//         },
//         {
//             name:"thumbnail",
//             maxCount:1
//         }
//         ]
//     ))


router.route("/video-upload").post(verifyJWT,uploadVideo.fields(
    [
        {
            name: "videoFile",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ]
),getVideoandThumbnail)

router.route("/video-publish").patch(verifyJWT,publishVideo)
router.route("/video-description/:videoID").patch(verifyJWT,updateVideoDescription)
router.route("/video-replace/:videoID").patch(verifyJWT,uploadVideo.single("videoFile"),replaceVideo)
router.route("/video-thumbnail-replace/:videoID").patch(verifyJWT,uploadVideo.single("thumbnail"),updateThumbnail)
router.route("/video-delete/:videoID").delete(verifyJWT,deleteVideo)
router.route("/video-get/:videoID").get(verifyJWT,getVideoInfo)
router.route("/video-watched/:videoID").patch(verifyJWT,addToWatchHistory)


export default router