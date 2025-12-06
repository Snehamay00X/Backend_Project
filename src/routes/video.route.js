import {Router} from "express"
import { uploadVideo } from "../middlewares/multer.middleware.js"
import { getVideoandThumbnail } from "../controllers/video.controller.js"


const router = Router()


router.route("/video-upload").post(uploadVideo.fields(
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

export default router