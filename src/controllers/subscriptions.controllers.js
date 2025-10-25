import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) {
    throw new ApiError(401, "Error while getting the channel ID");
  }
  const subscriberId = req.user?._id;
  if (!subscriberId) {
    throw new ApiError(501, "Unauthorized to Subscribe please login first");
  }
  const existingSubscriber = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });
  if (existingSubscriber) {
    await Subscription.deleteOne({ _id: existingSubscriber._id });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Uubscribed Successfully"));
  }
  const newSubscriber = await Subscription.create({
    subscriber: subscriberId,
    channel: channelId,
  });
  const newSubscriberWithSubscriberDetails = await newSubscriber.populate({
    path: "subscriber",
    select: "fullName userName avatar _id",
  });
  return res.status(201).json(
    new ApiResponse(
      201,
      {
        newSubscriber,
        // SubscriberDetails: newSubscriberWithSubscriberDetails,
      },
      "Subscribed Successfully"
    )
  );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) {
    throw new ApiError(401, "Error while getting the channel ID");
  }
  const subscribers = await Subscription.find({ channel: channelId });
  if (!subscribers || subscribers.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { subscribers: [] },
          "No Subscribers found for this channel"
        )
      );
  }
  const subscribersWithDetails = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
        pipeline: [
          {
            $project: {
              fullName: 1,
              userName: 1,
              avatar: 1,
              _id: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscriberDetails",
    },
    {
      $project: {
        subscriber: 1,
        channel: 1,
        createdAt: 1,
        subscriberDetails: 1,
      },
    },
  ]);
  if (subscribersWithDetails.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { subscribers: [] },
          "No subscribers found for this channel"
        )
      );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscribers: subscribersWithDetails },
        "Subscribers fetched successfully"
      )
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  // get userid from req.params and validate it
  // find user from DB if it is authentic, the match req.user?._id = userId
  // the get its subscribed channels using aggregate
  // send response
  //-------------------------------------------------//
  // get userid from req.params and validate it
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(400, "User ID is missing");
  }
  // find user from DB if it is authentic, the match req.user?._id = userId
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(401, "User not found");
  }
  if (userId.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "You are not authorized");
  }
  // the get its subscribed channels using aggregate
  const getChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelsDetails",
        pipeline: [
          {
            $project: {
              fullName: 1,
              userName: 1,
              avatar: 1,
              _id: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$channelsDetails" },
    {
      $project: {
        channel: 1,
        channelsDetails: 1,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);
  if (getChannels.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          404,
          { channels: [] },
          "You did not Subscribed to any Channel"
        )
      );
  }
  // send response
  return res
    .status(200)
    .json(
      new ApiResponse(200, getChannels, "Successfully get all the Channels")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
