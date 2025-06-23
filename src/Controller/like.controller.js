import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId = req.user.id //Assuming the user is authenticated and their ID is in req.user.

    //validation
        if(!mongoose.Types.ObjectId.isValid(videoId)){
            throw new ApiError(400, "Invalid videoId")
        }

    
    const existingLike= await Like.findOne({ videoId, userId});

    if(existingLike){

        await Like.deleteOne({ videoId, userId});
        return res.
        status(200).
        json( new ApiResponse(200, null, "Like Removed"))
    }

    const newLike = new Like({
        videoId,
        userId
    });

    await newLike.save();

    return res.
    status(200).
    json( new ApiResponse(200, newLike, "Like added Successsfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userId = req.user.id //Assuming the user is authenticated and their ID is in req.user.

    //validation
        if(!mongoose.Types.ObjectId.isValid(commentId)){
            throw new ApiError(400, "Invalid commentId")
        }

    
    const existingLike= await Like.findOne({ commentId, userId});

    if(existingLike){

        await Like.deleteOne({ commentId, userId});
        return res.
        status(200).
        json( new ApiResponse(200, null, "Like Removed"))
    }

    const newLike = new Like({
        commentId,
        userId
    });

    await newLike.save();

    return res.
    status(200).
    json( new ApiResponse(200, newLike, "Like added Successsfully"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const userId = req.user.id //Assuming the user is authenticated and their ID is in req.user.

    //validation
        if(!mongoose.Types.ObjectId.isValid(tweetId)){
            throw new ApiError(400, "Invalid tweetId")
        }

    
    const existingLike= await Like.findOne({ tweetId, userId});

    if(existingLike){

        await Like.deleteOne({ tweetId, userId});
        return res.
        status(200).
        json( new ApiResponse(200, null, "Like Removed"))
    }

    const newLike = new Like({
        tweetId,
        userId
    });

    await newLike.save();

    return res.
    status(200).
    json( new ApiResponse(200, newLike, "Like added Successsfully"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId= req.user.id;

    //find liked videos

    const likedVideos = await Like.find({ userId }).select('videoId');

    if(!likedVideos){
        throw new ApiError(404, "No liked Videos Found");
    }

    // Retrieve video details for each liked video (assuming a `Video` model exists)
    const videoIds = likedVideos.map(like => like.videoId);
    const videos = await Video.find({ _id: { $in: videoIds } });

    return res.
    status(200).
    json( new ApiResponse(200, videos, "Liked videos Fetched Successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}