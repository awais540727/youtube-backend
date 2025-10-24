import express from "express";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweets.controllers.js";
import { JwtVerify } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(JwtVerify); // Apply verifyJWT middleware to all routes in this file

router.route("/post-tweet").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;
