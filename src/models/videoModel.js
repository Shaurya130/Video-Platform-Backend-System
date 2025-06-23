import mongoose,{Schema} from "mongoose";

const videoSchema= new Schema(
    {
        videoFile:{
            type: String , //cloudinary url
            required: [true,"password is required"],
        },
        thumbnail:{
            type: String, //cloudinary url
            required: [true,"password is required"],
        },
        title:{
            type: String,
            required: [true,"password is required"],
        },
        description:{
            type: String,
            required:[true,"avatar is required"]
        },
        views:{
            type: Number,
            default:0
        },
        duration:{
            type: Number,
            required: true
        },
        isPublished:{
            type: Boolean,
            default: true
        },
        owner:{
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true}
)

export const User= mongoose.model("User", userSchema)