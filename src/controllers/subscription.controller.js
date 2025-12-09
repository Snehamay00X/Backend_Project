import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { apiError } from "../utils/api-error.js";
import {apiResponse} from "../utils/api-response.js"
import { asyncHandler } from "../utils/asyncHandler.js";




export const toggleSubscription = asyncHandler(async(req,res)=>{
    const {channelID} = req.params
    const userID = req.user._id

    if (!channelID) {
        throw new apiError(400,"Channel Id is mandatory")
    }

    if (channelID.toString() == userID.toString()) {
        throw new apiError(400,"You can't subscribe to your own channel")
    }

    const existing = await Subscription.findOne(
        {
            subscriber: userID,
            channel: channelID
        }
    )

    if (existing) {
        await Subscription.findByIdAndDelete(existing._id)
        return res.status(200).json(
            new apiResponse(200,{
                subscribed: false
            },"Unsubscribed successfully")
        )
    }




    const newSubscription = await Subscription.create(
        {
            subscriber: userID,
            channel: channelID
        }
    )
    res.status(201)
    .json(
        new apiResponse(201,newSubscription,"Subscribed Successfully")
    )
    
})


export const getSubscribers = asyncHandler(async (req, res) => {
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            fullName: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscriber"  // flatten subscriber array to object
        },
        {
            $project: {
                _id: 0,
                subscriberId: "$subscriber._id",
                username: "$subscriber.username",
                avatar: "$subscriber.avatar",
                fullName: "$subscriber.fullName",
                subscribedAt: "$createdAt"
            }
        },
        {
            $sort: { subscribedAt: -1 } // optional: newest first
        }
    ]);

    return res.status(200).json(
        new apiResponse(
            200,
            {
                count: subscribers.length,
                subscribers
            },
            "Subscribers list fetched successfully"
        )
    );
});

export const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            fullName: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$channel"   // flatten the array → single channel object
        }
    ]);

    return res.status(200).json(
        new apiResponse(
            200,
            subscribedChannels,
            "Subscribed channels fetched successfully"
        )
    );
});