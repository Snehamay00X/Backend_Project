import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from bcrypt

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    email:{
        type: String,
        required: true
    },
    fullName:{
        type: String,
        required: true,
        index: true
    },
    avatar:{
        type: String, // cloudinry URL
        required:true
    },
    coverimage:{
        type: String  // cloudinry URL
    },
    password:{
        type: String,
        required: [true,"Password is required"]
    },
    refreshToken:{
        type: String,
        required: true
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref:"Video"
        }
    ]

},{timestamps: true})

/// Encrypting Password 
userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCoreect = async function (password) {
     return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
)
}

userSchema.methods.generateRefreshToken = function(){
    jwt.sign({
        _id: this._id,
        
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const User = mongoose.model("User",userSchema)