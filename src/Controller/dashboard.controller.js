import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Get all videos of the channel
    const videos = await Video.find({ owner: userId });

    const totalVideos = videos.length;
    const totalViews = videos.reduce((sum, video) => sum + video.views, 0);
    const videoIds = videos.map(video => video._id);

    // Get total likes on videos of this channel
    const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });

    // Get total subscribers of this channel
    const totalSubscribers = await Subscription.countDocuments({ channel: userId });

    return res.status(200).json(new ApiResponse(200, {
        totalVideos,
        totalViews,
        totalLikes,
        totalSubscribers
    }, "Channel stats fetched successfully"));
});


const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const videos = await Video.find({ owner: userId }).sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});


export {
    getChannelStats, 
    getChannelVideos
    }