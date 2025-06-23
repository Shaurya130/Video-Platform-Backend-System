import { Router } from "express";

import { registerUser, logoutUser, loginUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, getUserChannelProfile, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getWatchHistory,} from "../Controller/user.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js"; //middleware

import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

//Free Routes

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

router.route("/refresh-token").post(refreshAccessToken)



// secured routes

router.route("/logout").post(verifyJWT,logoutUser) //injecting middleware

router.route("/change-password").post(verifyJWT,changeCurrentPassword)

router.route("/current-user").get(verifyJWT,getCurrentUser)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

router.route("/update-account").patch(verifyJWT,updateAccountDetails)

router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)

router.route("/update-cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

router.route("/get-watch-history").get(verifyJWT, getWatchHistory)

export default router