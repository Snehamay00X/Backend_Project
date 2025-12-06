import { Router } from "express";
import { loginUser, logoutUser, registerUser,refreshAccessToken, updateAvatar, updateCoverImage, changeCurrentPassword, getCurrentUser, updateAccountDeatils, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverimage",
            maxCount:1
        }
    ]),
    registerUser)

    router.route("/login").post(loginUser)
    router.route("/refresh-token").post(refreshAccessToken)

    
    /// secured routes
    
    router.route("/logout").post(verifyJWT,logoutUser)
    router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateAvatar)
    router.route("/update-cover").patch(verifyJWT,upload.single("avatar"),updateCoverImage)
    router.route("/change-password").post(verifyJWT,changeCurrentPassword)
    router.route("/current-user").get(verifyJWT,getCurrentUser)
    router.route("/current-user").post(verifyJWT,getCurrentUser)
    router.route("/update-details").patch(verifyJWT,updateAccountDeatils)
    router.route("/channel/:username").get(verifyJWT,getUserChannelProfile)
    router.route("/watchhistory").get(verifyJWT,getWatchHistory)



export default router