import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/api-error.js"
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/api-response.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

// genereating Tokens

const generateAccessAndRefreshToken = async(userID)=>{
    try {
        const user = await User.findById(userID)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()


        /// saving refreshToken to DB because we'll verify it again
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})/// not triggering other feilds while saving

        return {refreshToken,accessToken}

    } catch (error) {
        throw new apiError(500,error?.message||"Spmething went wrong while generating access and refreshtoken please try again")
    }
}

//////////////////////////////////////////////////////////////////////////////////////////


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

    const exitedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    
    if(exitedUser){
        throw new apiError(409,"User Already Exists")
    }
    
    //// storing images to local path

    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log(avatarLocalPath);
    
    const coverimageLocalPath = req.files?.coverimage[0]?.path;

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
        username: username.toLowerCase(),
        email,
        password
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

///////////////////////////////////////////////////////////////////////////////////////////

export const loginUser = asyncHandler(async(req,res)=>{
    ////****** steps to login user *//
    // get the data from the user from req.body
    // Username/email & password of the user
    // verify if they are correct individually
    // once they are logged in give them access & refresh token
    // from the next time of login use just tokens by using cookies

    const {username,email,password} = req.body

    if (!(username || email)) {
        throw new apiError(400,"Couldn't find the user")
    }
    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new apiError(404,"User doesn't exists")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new apiError(404,"Password is incorrect")
    }

    const {refreshToken,accessToken} = await generateAccessAndRefreshToken(user._id)


    const loggenInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new apiResponse(200,{
            user: loggenInUser,accessToken,refreshToken
        },
        "User Logged In Successfully"
    )
    )

})

//////////////////////////////////////////////////////////////////////////////////////////

export const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined

            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new apiResponse(200,{},"User logged out succesfully")
    )
})

/////////////////////////////////////////////////////////////////////////////////////////

export const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new apiError(400,"Unauthorized access")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user = User.findById(decodedToken?._id)
    
        if (!user) {
            throw new apiError(401,"Invalid RefreshToken")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new apiError(402,"Token doesn't match")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken,newrefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new apiResponse(200,{
                accessToken,
                refreshToken:newrefreshToken
            },
            "Access Token refreshed Successfully"
        )
        )
    } catch (error) {
        throw new apiError(400,error?.message || "Unauthorized Access")
    }

})
///////////////////////////////////////////////////////////////////////////////////////////

/////////    ######  Utility Methods  #######   ////////////////

export const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const validPassword = await user.isPasswordCorrect(oldPassword)

    if (!validPassword) {
        throw new apiError(400,"Password doesn't match")
    }

    user.password = newPassword

    await user.save({validateBeforeSave: false})


    return res.status(200)
    .json(
        new apiResponse(200,{},"Password changes successfully")
    )

    ////// Can't use below code cause it'll not trigger pre hook so the password won't be hashed
    // User.findByIdAndUpdate(
    //     user._id,
    //     {
    //         password: newPassword
    //     },
    //     {
    //         new: true
    //     }
    // )
})

export const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(
        new apiResponse(200,req.user,"Current user fetched succesfully")
    )
})

export const updateAccountDeatils = asyncHandler(async(req,res)=>{
    const{username,email} = req.body

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                username, //// both are correct syntax
                email: email
            }
        },
        {
            new: true
        }
    ).select("-password")
    
    res.status(200)
    .json(
        new apiResponse(200,user,"Account details updated successfully")
    )
})


export const updateAvatar = asyncHandler(async(req,res)=>{
    
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new apiError(400,"Avatar is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new apiError(400,"Couldn't upload avatar to cloudinary")
    }

    ///// deleting old avatar
    const oldUser = await User.findById(req.user?._id)
    
    const oldAvatarURL = oldUser?.avatar
    
    if (!oldAvatarURL) {
        throw new apiError(400,"No Avatar Found to delete")
    }
    await deleteFromCloudinary(oldAvatarURL)

    
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true
        }
    ).select("-password")

    res.status(200)
    .json(
        new apiResponse(200,user,"Avatar image uploaded successfully")
    )


})

export const updateCoverImage = asyncHandler(async(req,res)=>{
    
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new apiError(400,"Cover Image is missing")
    }

    const coverimage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverimage.url) {
        throw new apiError(400,"Couldn't upload cover image to cloudinary")
    }

    ///// deleting old CoverImage
    const oldUser = await User.findById(req.user?._id)
    
    const oldCoverURL = oldUser?.avatar
    
    if (!oldCoverURL) {
        throw new apiError(400,"No Cover Image Found to delete")
    }
    await deleteFromCloudinary(oldCoverURL)

    
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverimage: coverimage.url
            }
        },
        {
            new:true
        }
    ).select("-password")

    res.status(200)
    .json(
        new apiResponse(200,user,"Cover image uploaded successfully")
    )
})


export const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params

    if (!username?.trim()) {
        throw new apiError(400,"Username is missing")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()///// finding the user got from params
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                 from: "subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },{
            $addFields:{
                subsscriberCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                email: 1,
                subsscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverimage: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new apiError(404,"Channel doesn't exists")
    }

    return res.status(200)
    .json(
        new apiResponse(200,channel[0],"User channel fetched succesfully")
    )

})

export const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        avatar:1,
                                        fullName:1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner" //// overwrite the owner field and replace the returned array with the Object at 0th place llike arr[0]
                            }
                        }
                    }
                ]
            }
        }
    ])

    res
    .status(200)
    .json(
        new apiResponse(200,user[0].watchHistory,"Watch History fethced succesfully")
    )

})



