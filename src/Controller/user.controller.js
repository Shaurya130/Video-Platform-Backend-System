import { asyncHandler } from "../utils/asyncHandle.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/userModel.js"
import {deletefromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose, { Mongoose } from "mongoose"

const generateAccessAndRefreshToken = async(userId) => {

    const user= await User.findById(userId)
    if(!user)
    {
        throw new ApiError(404, "User Not Found")
    }
    try {
        const accessToken =user.generateAccessToken()
        const refreshToken =user.generateRefreshToken()
    
        user.refreshToken= refreshToken
        await user.save({validateBeforeSave: false })
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500, "Server issue,please try again later")
    }
}

const registerUser= asyncHandler( async(req,res) => {

        // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const { fullName, email, username, password} = req.body; // all details taken from user except avatar and image

    const userExist=await User.findOne({
        $or: [ {username}, {email}]
    })

    const avatarLocalPath=req.files?.avatar?.[0]?.path
    console.log(avatarLocalPath);
    
    const coverLocalPath=req.files?.coverImage?.[0]?.path
    console.log(coverLocalPath);
    

    //validation
    if( [fullName,email,username,password].some((field)=> field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }
    if( userExist){
        throw new ApiError(409, "User with username or email already exist")
    }
    if(!avatarLocalPath){
        throw new ApiError( 400, "Avatar is required")
    }
    if(!coverLocalPath){
        throw new ApiError( 400, "Cover Image is required")
    }

    //creation

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    
    const coverImage=await uploadOnCloudinary(coverLocalPath)

    try {
        const user=await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage.url,
            email,
            username: username.toLowerCase(),
            password
        })
    
        const createdUser= await User.findById(user._id).select(
            "-password -refreshToken"
        )
    
        if(!createdUser){
            throw new ApiError(500, "Something went wrong while registering the user")
        }
    
        return res.status(201).json( new ApiResponse(200, createdUser,"User Registered successfully"))
    } catch (error) {
        console.log("User Creation failed");
        if(avatar){
            await deletefromCloudinary(avatar.public_id)
        }
        if(coverImage){
            await deletefromCloudinary(coverImage.public_id)
        }
        throw new ApiError(500,"Something went wrong while registerring the user and images were deleted")
        
    }
})

const loginUser = asyncHandler( async (req,res) => {
    // login

    const {username,password,email}= req.body
    // validation

    if( !username || !password || !email)
    {
        throw new ApiError(400, "All fields are mandatory")
    }

    const user= User.findOne({
        $or:[{username},{email}]
    })

    if(!user)
    {
        throw new ApiError(404, "User not found")
    }

    // validate password

   const isPassValid= await user.isPasswordCorrect(password)

   if(!isPassValid)
   {
    throw new ApiError(401, "Invalid Credentials")
   }
    
  try {
     const {accessToken , refreshToken}= await generateAccessAndRefreshToken(user._id)
  
     const loggedInUser = await User.findById(user._id).
     select( "-password, -refreshToken")
  } catch (error) {
    throw new ApiError(500, "Server error while creating token")
  }

  const options={
    httpOnly: true, // makes the cookie modificatiion only at server end
    secure: process.env.NODE_ENV === "production"
  }

  return res
  .status(200)
  .cookie("accessToken",accessToken, options)
  .cookie("refreshToken",refreshToken, options)
  .json( new ApiResponse(200,
    { user: loggedInUser,accessToken,refreshToken }, 
    "User logged in successfully"))

})

const logoutUser = asyncHandler ( async (req,res) => {
    await User.findByIdAndUpdate(
       req.user._id,{
        $set:{
            refreshToken : undefined
        }
       },
       {new: true}
    )

    const options={
        httpOnly: true, // makes the cookie modificatiion only at server end
        secure: process.env.NODE_ENV === "production"
      }

      return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json( new ApiResponse(200,
        {}, " User logged out successfully"))

})

const refreshAccessToken= asyncHandler( async (req,res) => {
    const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken)
    {
        throw new ApiError(401,"Refresh Token is required")
    }

    try {
        
        const decodedToken= jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user=await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }

        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Invalid Token")
        }

        const options={
            httpOnly: true, // makes the cookie modificatiion only at server end
            secure: process.env.NODE_ENV === "production"
          }
        
          const {accessToken, refreshToken:newrefreshToken} = await generateAccessAndRefreshToken(user._id)

          return res
          .status(200)
          .cookie("accessToken",accessToken, options)
          .cookie("refreshToken",newrefreshToken, options)
          .json( new ApiResponse(200,
            { accessToken,refreshToken: newrefreshToken }, 
            "Access Token Refreshed successfully"))
    } catch (error) {
        throw new ApiError(500, "Something went wrong while refreshing the access Token")
    }
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

const getUserChannelProfile= asyncHandler(async (req,res) => {

    const {username}=req.params

    if(!username?.trim()){
        throw new ApiError(400, "Username is required")
    }

    const channel= await User.aggregate(
         [
            {
                $match:{
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup:{
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscibers"
                }
            },
            {
                $lookup:{
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subsciber",
                    as: "subscibedTo"
                }
            },
            {
                $addFields:{
                    subsciberCount:{
                        $size: "$subscibers"
                    },
                    channelsSubscribedTo:{
                        $size: "$subscibedTo"
                    },
                    isSubscribed:{
                        $cond:{
                            if:{$in: [req.user._id, "$subscibers.susciber"] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                //project only necessary data
                $project:{
                    fullName:1,
                    username:1,
                    avatar:1,
                    coverImage:1,
                    subsciberCount:1,
                    channelsSubscribedTo:1,
                    isSubscribed:1,
                    email:1
                }
            }
         ]
    )

    if(!channel?.length){
        throw new ApiError(404, "Channel not Found")
    }

    return res.
    status(200).
    json( new ApiResponse(
        200, channel[0],
        "Channel Profile Fetched SuccessFully"
    ))
})

const getWatchHistory= asyncHandler(async (req,res) => {

    const user= await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "WatchHistory"
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project:{
                            fullName:1,
                            username:1,
                            avatar:1
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.
    status(200).
    json( new ApiResponse(
        200, user[0]?.WatchHistory,
        "Watch History Fetched SuccessFully"
    ))
    
})

export{
    registerUser, 
    loginUser, 
    refreshAccessToken, 
    logoutUser,
    changeCurrentPassword,
    getCurrentUser ,
    updateAccountDetails,
    updateUserAvatar , 
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}