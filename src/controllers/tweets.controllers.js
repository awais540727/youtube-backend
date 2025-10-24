import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "./../models/user.model.js";
import { Tweet } from "./../models/tweets.model.js";
const createTweet = asyncHandler(async (req, res) => {
  // get content from req.body and user using middleware from req.user?._id
  // validate
  // check if it is authentic user
  // yes its authentic user then create record in DB
  // Populate user details (after creation)
  // send response content with user details
  //-------------------------------------//
  // get content from req.body and user using middleware from req.user?._id
  const { content } = req.body;
  // console.log("content-------->", typeof content);
  // validate
  if (!content) {
    throw new ApiError(401, "Content is missing");
  }
  // check if it is authentic user
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(401, "User is not Authenticated");
  }
  // yes its authentic user then create record in DB
  const createTweet = await Tweet.create({
    content,
    owner: user._id,
  });

  // Populate user details (after creation)
  const populatedTweet = await createTweet.populate({
    path: "owner",
    select: "fullName userName avatar _id", // only required fields
  });
  // send response content with user details
  return res.status(201).json(
    new ApiResponse(
      201,
      {
        tweet: populatedTweet,
      },
      "Tweeted Successfully"
    )
  );
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!req.user?._id || !userId) {
    throw new ApiError(401, "Unauthenticated user");
  }
  if (req.user?._id.toString() !== userId.toString()) {
    throw new ApiError(402, "You are not allowed");
  }
  const tweetWithUserDetails = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
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
      $unwind: "$ownerDetails",
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        owner: 1,
        ownerDetails: 1,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        tweetWithUserDetails,
        "Successfully Got all the user Tweets"
      )
    );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new ApiError(401, "Content is missing");
  }
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(401, "Tweet ID is missing");
  }
  const findTweetToValidateAuthenticUser = await Tweet.findById(tweetId);
  if (!findTweetToValidateAuthenticUser) {
    throw new ApiError(501, "Tweet not found");
  }
  if (
    findTweetToValidateAuthenticUser.owner.toString() !==
    req.user?._id.toString()
  ) {
    throw new ApiError(401, "You are not allowed to Update it");
  }
  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      content,
    },
    { new: true }
  );
  const updatedTweetWithUserDetails = await updatedTweet.populate({
    path: "owner",
    select: "fullName userName avatar _id",
  });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updatedYourTweet: updatedTweetWithUserDetails },
        "Updated Successfully"
      )
    );
});

const deleteTweet = asyncHandler(async (req, res) => {
  // get tweet id from req.params
  // first find tweet from DB to check wheather he authentic user or not
  // delete tweet from DB
  // send response
  //-----------------------------------------------------------//
  // get tweet id from req.params
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(401, "Tweet ID is missing");
  }
  // first find tweet from DB to check wheather he authentic user or not
  const existingTweet = await Tweet.findById(tweetId);
  if (!existingTweet) {
    throw new ApiError(501, "Tweet not found");
  }
  if (existingTweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(401, "You are not allowed to delete it");
  }
  // delete tweet from DB
  await Tweet.findByIdAndDelete(tweetId);
  // send response
  const checkWheatherItIsDeleted = await Tweet.findById(tweetId);
  if (!checkWheatherItIsDeleted) {
    return res.status(200).json(new ApiResponse(200, "Deleted Successfully"));
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
