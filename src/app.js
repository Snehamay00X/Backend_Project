import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"
const app = express()

// Configuration Express for handelling differnt types of request
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))
app.use(express.static("Public"))
app.use(cookieParser())

//routes

import router from './routes/user.route.js'
// routes declaration
app.use('/api/v1/users',router)

/// video routes
import videorouter from "./routes/video.route.js"
app.use('/api/v1/video',videorouter)

/// subscription routes
import subscriptionrouter from "./routes/subscription.route.js"
app.use('/api/v1/subscription',subscriptionrouter)


export {app}
