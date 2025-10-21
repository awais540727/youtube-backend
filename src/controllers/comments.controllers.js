import mongoose from "mongoose";
// import {Comment} from "../models/comment.model.js"
// import {ApiError} from "../utils/ApiError.js"
// import {ApiResponse} from "../utils/ApiResponse.js"
// import {asyncHandler} from "../utils/asyncHandler.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Comment } from "../models/comments.model.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComments = asyncHandler(async (req, res) => {
  // get video id and validate
  // get all the comments of a specific video with their owner
  // send response
  //-----------------------------//
  // get video id and validate
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!videoId) {
    throw new ApiError(401, "Video id is missing ");
  }
  // get all the comments of a specific video with their owner
  const result = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      // Join each comment with its commenter's user details
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "commenterDetails",
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
      // Convert the user array into a single embedded object
      $unwind: "$commenterDetails",
    },
    {
      $project: {
        content: 1,
        video: 1,
        owner: 1,
        commenterDetails: 1,
        createdAt: 1,
      },
    },
    {
      // Sort comments (latest first)
      $sort: { createdAt: -1 },
    },
    {
      // Skip documents based on current page
      $skip: (Number(page) - 1) * Number(limit),
    },
    {
      // Limit the number of returned comments
      $limit: Number(limit),
    },
  ]);
  // send response
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Fetched all comments successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // get video id, comment content
  // validate them and validate user
  // find video to confirm that if video exist in DB
  // create comment in DB
  // get user details using aggregate
  // Send response
  //-------------------------------//
  // get video id, comment content
  const { videoId } = req.params;
  const { comment } = req.body;
  //   console.log("Type of comment --->", typeof comment);
  //   console.log("comment ---->", comment);
  // validate them and validate user
  if (!videoId) {
    throw new ApiError(400, "Video id is missing ");
  }
  if (!comment || typeof comment !== "string" || comment.trim() === "") {
    console.log("Type of comment --->", typeof comment);
    throw new ApiError(400, "Comment is missing ");
  }
  // find video to confirm that if video exist in DB
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video does not found");
  }
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized user");
  }
  // create comment in DB
  const addComment = await Comment.create({
    content: comment,
    video: videoId,
    owner: req.user._id,
  });
  // get user details using aggregate
  const result = await Comment.aggregate([
    {
      $match: {
        _id: addComment._id,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "userDetails",
        pipeline: [
          {
            $project: {
              fullName: 1,
              userName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$userDetails",
    },
    {
      $project: {
        _id: 1,
        content: 1,
        video: 1,
        owner: 1,
        userDetails: 1,
        createdAt: 1,
      },
    },
  ]);
  if (!result) {
    throw new ApiError(401, "Comething went wrong while geting final details");
  }
  // Send response
  return res
    .status(201)
    .json(new ApiResponse(201, result[0], "Commented Successfully"));
});

export { getVideoComments, addComment };
