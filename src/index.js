import dotenv from 'dotenv'
dotenv.config({ path: './env' })
import connectDB from "./db/db.js";
import { app } from './app.js';
const PORT = process.env.PORT || 8000


connectDB()
.then(()=>{
    app.listen(PORT,()=>{
        console.log(`App is listening on ${PORT}`)
    })
})
.catch((err)=> console.log('MongoDB connection Failed', err))

app.on("error",(error)=>{
            console.log("error while connecting to db: ",error)
        })




















/*
import express from "express";
const app = express()

;(async ()=> {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("error while connecting to db: ",error)
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on ${process.env.PORT}`)
        })
    }
    catch(error){
        console.log("Error :",error)
        throw error
    }
})()
*/