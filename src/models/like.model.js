import {mongoose,Schema,model} from "mongoose";

const likeSchema = new Schema({
    comment:{
        type: Schema.Types.ObjectId,
        ref: "Comment",
        required: true
    },
    video:{
        type: Schema.Types.ObjectId,
        ref: "Video",
        required: true
    },
    likedBy:{
        type: Schema.Types.ObjectId,
        ref: "Users",
        required: true
    }
},{timestamps: true})


export const Like = model("Like",likeSchema)