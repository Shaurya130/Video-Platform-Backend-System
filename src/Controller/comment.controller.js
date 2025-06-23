import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {

    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query  //req.query object contains the query parameters from the request URL.{/comments?page=2&limit=5}
    const skip= (page - 1) * limit

    //validation
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const comments= await Comment.find({videoId})
    .skip(skip)
    .limit(limit)
    .sort({createdAt: -1})  // Sort by the most recent comments

    return res.
    status(200).
    json( new ApiResponse(200, comments, "Comments Fetched Successfully"))

})

const addComment = asyncHandler(async (req, res) => {

    const {videoId} = req.params
    const { userId, text } = req.body

    // validating videoId

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    // validating comment length 

    if (!text || text.trim().length === 0) {
        throw new ApiError(400, "Comment text is required")
    }

    //creating the new comment

    const newComment = new Comment({
        text, 
        videoId,
        userId,
        createdAt: new Date()
    }) 

    await newComment.save() // saving the comment

    //api response
    return res.
    status(200).
    json( new ApiResponse(200, comments, "New Comment Added Successfully"))

})

const updateComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params
    const { text } = req.body

    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400, "Invalid commentId")
    }

    //finding comment

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(400, "Comment not found")
    }

    comment.text= text || comment.text

    await comment.save()

    //api response
    return res.
    status(200).
    json( new ApiResponse(200, comment, "Comment Updated Successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params

    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400, "Invalid commentId")
    }

    //finding comment

    const comment = await Comment.findByIdAndDelete(commentId)

    if(!comment){
        throw new ApiError(400, "Comment not found")
    }

    //api response
    return res.
    status(200).
    json( new ApiResponse(200, null, "Comment Deleted Successfully"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }