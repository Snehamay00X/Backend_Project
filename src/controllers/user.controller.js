import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/api-error.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/api-response.js";

export const registerUser = asyncHandler(async (req,res)=>{
    // ******* steps to get data from user ********
    // get user details from frontend
    // validation - not empty
    // check if user already exits - username, email
    // check for images, check for avatar
    // upload them to clodinary
    // check if images are uploaded in cloudinary
    // create user object -- create enrty in db
    // remove password, refresh token field befaore sending it to frontEnd
    // check for user creation
    // return response




    /// getting user data

    const {username,email,fullName,password} = req.body
    console.log(username,email,password)

    /// checking if the field is empty// you can check all the conditions individually

    if (
        [fullName,email,username,password].some((field)=>{
            return field?.trim() === ""
        })
    ) {
        throw new apiError(400,"All fields are necessory")
    }
    
    /// checking if the User already exists username,email

    const exitedUser = User.findOne({
        $or: [{username}, {email}]
    })
    
    if(exitedUser){
        throw new apiError(409,"User Already Exists")
    }
    
    //// storing images to local path

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverimageLocalPath = req.files?.coverimage[0]?.path

    if(!avatarLocalPath){
        throw new apiError(410,"Please upload your image")
    }


    /// upload images to cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverimage = await uploadOnCloudinary(coverimageLocalPath)


    /// check if images are properly uploaded or not

    if(!avatar){
        throw new apiError(410,"Please upload your image")
    }

    /// create User in DB

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverimage: coverimage?.url || "",
        username: username.toLowerCase()
    })

    // checking if the user is created in DB

    const createdUser = await User.findById(user._id) /// mongoDB automatically create "_id" field like username,email
    .select(
        "-password -refreshToken"     //// removes this fields from createUser
    )

    if(!createdUser){
        throw new apiError(500,"Please try again")
    }

    /// returning response

    return res.status(201).json(
        new apiResponse(200,createdUser,"User successfully created")
    )




})