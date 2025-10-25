import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  // getSubscribedChannels, // GET all channels user subscribed to
  // getChannelSubscribers, // GET all subscribers of a channel
  toggleSubscription, // POST toggle subscribe/unsubscribe
} from "../controllers/subscriptions.controllers.js";
import { JwtVerify } from "../middleware/auth.middleware.js";

const router = Router();

router.use(JwtVerify);

// Subscribe or unsubscribe to a channel
router.post("/add-sub/:channelId", toggleSubscription);

// // Get all subscribers of a specific channel
router.get("/get-subscribers/:channelId", getUserChannelSubscribers);

// Get all channels that a user has subscribed to
router.get("/get-channels-of-user/:userId", getSubscribedChannels);
export default router;

// import { Router } from "express";
// import {
//   getSubscribedChannels,
//   getUserChannelSubscribers,
//   toggleSubscription,
// } from "../controllers/subscriptions.controllers.js";
// import { JwtVerify } from "../middlewares/auth.middleware.js";

// const router = Router();
// router.use(JwtVerify); // Apply verifyJWT middleware to all routes in this file

// router
//   .route("/c/:channelId")
//   .get(getSubscribedChannels)
//   .post(toggleSubscription);

// router.route("/u/:subscriberId").get(getUserChannelSubscribers);

// export default router;
