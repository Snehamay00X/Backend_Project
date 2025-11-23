import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
    
    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME, 
        api_key: process.env.API_KEY, 
        api_secret: process.env.API_SECRET // Click 'View API Keys' above to copy your API secret
    });
    
    // Function for taking a local path for an file and sending it to cloudinary
   export const uploadOnCloudinary = async (localFilePath)=>{
        try {
            if(!localFilePath) return null
            // upload file on clodinary
            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type: "auto"
            })
            fs.unlinkSync(localFilePath)
            return response
        } catch (error) {
            fs.unlinkSync(localFilePath)// remove the locally saved file to free up space
            return null
        }
    }
    