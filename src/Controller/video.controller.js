import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Get all videos (with query, sort, pagination)
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query;

    const filter = {
        isPublished: true,
        ...(query && { title: { $regex: query, $options: "i" } }),
        ...(userId && { owner: userId }),
    };

    const sortOptions = {
        [sortBy]: sortType === "asc" ? 1 : -1,
    };

    const videos = await Video.find(filter)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate("owner", "username avatar");

    const total = await Video.countDocuments(filter);

    res.status(200).json(new ApiResponse(200, { videos, total }, "Videos fetched successfully"));
});

// Upload & publish video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!req.files?.video || !req.files?.thumbnail) {
        throw new ApiError(400, "Video and thumbnail files are required");
    }

    const videoUpload = await uploadOnCloudinary(req.files.video.tempFilePath);
    const thumbnailUpload = await uploadOnCloudinary(req.files.thumbnail.tempFilePath);

    if (!videoUpload?.url || !thumbnailUpload?.url) {
        throw new ApiError(500, "Cloudinary upload failed");
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        duration: Math.floor(videoUpload.duration), // assuming Cloudinary returns duration in seconds
        owner: req.user._id,
    });

    res.status(201).json(new ApiResponse(201, video, "Video uploaded successfully"));
});

// Get single video
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId).populate("owner", "username avatar");

    if (!video) throw new ApiError(404, "Video not found");

    res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});

// Update video
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only update your own videos");
    }

    video.title = title || video.title;
    video.description = description || video.description;

    if (req.files?.thumbnail) {
        const thumbnailUpload = await uploadOnCloudinary(req.files.thumbnail.tempFilePath);
        if (thumbnailUpload?.url) video.thumbnail = thumbnailUpload.url;
    }

    await video.save();
    res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});

// Delete video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own videos");
    }

    await video.deleteOne();
    res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});

// Toggle published/unpublished
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only update your own videos");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    res.status(200).json(new ApiResponse(200, video, `Video is now ${video.isPublished ? "Published" : "Unpublished"}`));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};
