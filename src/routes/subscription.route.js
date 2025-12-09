import { Router } from "express";
import {
    toggleSubscription,
    getSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All subscription routes require auth
router.use(verifyJWT);

/**
 * @route   POST /api/v1/subscriptions/:channelID
 * @desc    Toggle subscription to a channel (subscribe / unsubscribe)
 * @access  Private
 */
router
    .route("/:channelID")
    .post(toggleSubscription);

/**
 * @route   GET /api/v1/subscriptions/subscribers
 * @desc    Get all subscribers for the logged-in user's channel
 * @access  Private
 */
router
    .route("/subscribers/me")
    .get(getSubscribers);

/**
 * @route   GET /api/v1/subscriptions/channels
 * @desc    Get all channels the logged-in user is subscribed to
 * @access  Private
 */
router
    .route("/channels/me")
    .get(getSubscribedChannels);

export default router;