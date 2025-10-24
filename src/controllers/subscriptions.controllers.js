import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
        SubscriberDetails: newSubscriberWithSubscriberDetails,
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

export { toggleSubscription, getUserChannelSubscribers };
