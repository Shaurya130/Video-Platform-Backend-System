import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import dotenv from "dotenv";

dotenv.config()

// Cloudinary configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

/**
 * Uploads a file to Cloudinary
 * @param {string} localFilePath - The local file path
 * @returns {object|null} - Cloudinary response or null on failure
 */
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        console.log("Uploading file to Cloudinary:", localFilePath);
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });
        console.log("File uploaded on Cloudinary. File Src:", response.url);

        // Delete the file from local server
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        console.error("Error uploading file to Cloudinary:", error.message);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
}

/**
 * Deletes a file from Cloudinary
 * @param {string} publicId - The public ID of the file on Cloudinary
 */
const deletefromCloudinary = async (publicId) => {
    try {
        console.log("Deleting file from Cloudinary with public ID:", publicId);
        await cloudinary.uploader.destroy(publicId);
        console.log("Deleted from Cloudinary:", publicId);
    } catch (error) {
        console.error("Error deleting file from Cloudinary:", error.message);
        return null;
    }
}

export { uploadOnCloudinary, deletefromCloudinary };
    
//     // Upload an image
//      const uploadResult = await cloudinary.uploader
//        .upload(
//            'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
//                public_id: 'shoes',
//            }
//        )
//        .catch((error) => {
//            console.log(error);
//        });
    
//     console.log(uploadResult);
    
//     // Optimize delivery by resizing and applying auto-format and auto-quality
//     const optimizeUrl = cloudinary.url('shoes', {
//         fetch_format: 'auto',
//         quality: 'auto'
//     });
    
//     console.log(optimizeUrl);
    
//     // Transform the image: auto-crop to square aspect_ratio
//     const autoCropUrl = cloudinary.url('shoes', {
//         crop: 'auto',
//         gravity: 'auto',
//         width: 500,
//         height: 500,
//     });
    
//     console.log(autoCropUrl);    
// })();