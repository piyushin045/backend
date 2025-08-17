import { v2 as cloudinary } from 'cloudinary';
import fs from "fs" // filesystem to manage file system

import dotenv from "dotenv"

dotenv.config();

// Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
    });


    const uploadOnCloudinary = async (localFilePath) => {
        try {
            if(!localFilePath) return null
            console.log(localFilePath)

            // upload the file on cloudinary
            const response = await cloudinary.uploader.upload(localFilePath, {
                resource_type: "auto",

            })
            console.log(response)

            // remove temp file after successful upload
            if(fs.existsSync(localFilePath)){
                fs.unlinkSync(localFilePath)
            }
            // file has been uploaded sucessfuly
            console.log("file is uploaded on cloudinary", response.url);
            return response
            
            
        } catch(error) {
            console.log("Cloudinary upload failed",error)

            // remove temp if still exist 

            if(fs.existsSync(localFilePath)){
                fs.unlinkSync(localFilePath)
            }
            
            return null 
        }
    }

    export {uploadOnCloudinary}