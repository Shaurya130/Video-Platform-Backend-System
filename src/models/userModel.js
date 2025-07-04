import mongoose,{Schema} from "mongoose";
import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";

const userSchema= new Schema(
    {
        username:{
            type: String,
            required: [true,"username is required"],
            unique: true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type: String,
            required: [true,"email is required"],
            unique:true,
            lowercase: true,
            trim: true
        },
        fullName:{
            type: String,
            required: [true,"full name is required"],
            index:true,
            trim: true
        },
        
        avatar:{
            type: String,
            required:[true,"avatar is required"]
        },
        coverImage:{
            type: String,
            required:[true,"cover image is required"]
        },
        watchHistory:[{
            type: Schema.Types.ObjectId,
            ref: "Video"
        }],
        password:{
            type: String,
            required: [true,"password is required"]
        },
        refreshToken:{
            type: String
        }
    },
    { timestamps: true}
)

userSchema.pre("save",async function (next) {

    if(!this.isModified("password")) return next()

    this.password = bcrypt.hash(this.password, 10)
    next()
    
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)   
}

userSchema.methods.generateAccessToken = function(){
    // short lived access token
    return jwt.sign({
        _id:this._id,
        email: this.email,
        username: this.username
    },process.env.ACCESS_TOKEN_SECRET,{expiresIn: process.env.ACCESS_TOKEN_EXPIRY})
}

userSchema.methods.generateRefreshToken = function(){
    // short lived access token
    return jwt.sign({
        _id:this._id
    },process.env.REFRESH_TOKEN_SECRET,{expiresIn: process.env.REFRESH_TOKEN_EXPIRY})
}

export const User= mongoose.model("User", userSchema)