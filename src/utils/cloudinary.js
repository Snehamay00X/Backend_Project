import { v2 as cloudinary } from 'cloudinary';
import { extractPublicId } from 'cloudinary-build-url';
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

    export const deleteFromCloudinary = async(publicURL)=>{
        try {
            const publicID = extractPublicId(publicURL)
            const result = await cloudinary.uploader.destroy(publicID)
            console.log("Old images/Videos has been deleted",result)
            return result
        } catch (error) {
            return console.log(error.message || "Something went wrong")
        }
    }
    
    export const getVideoDuration = async(publicURL)=>{
        try {
            const publicID = extractPublicId(publicURL)
            const result = await cloudinary.api.resource(publicID,{
                resource_type: 'video',
                media_metadata: true
            })
            return result.duration
        } catch (error) {
            return console.log(error.message || "Something went wrong")
        }
    }