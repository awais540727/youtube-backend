import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinar } from "../utils/Cloudinary.js";
import { Video } from "../models/video.model.js";
import { v2 as cloudinary } from "cloudinary";
const getAllVideos = asyncHandler(async (req, res) => {
  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
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
              _id: 0,
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
        title: 1,
        description: 1,
        thumbnail: 1,
        videoFile: 1,
        duration: 1,
        views: 1,
        ownerDetails: 1,
      },
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

// const getAllVideos = asyncHandler(async (req, res) => {
//   if (!req.user?._id) {
//     throw new ApiError(401, "UnAuthorized User");
//   }
//   const videos = await Video.aggregate([
//     {
//       $match: {
//         owner: new mongoose.Types.ObjectId(req.user?._id),
//       },
//     },
//     {
//       $lookup: {
//         from: "users",
//         localField: "owner",
//         foreignField: "_id",
//         as: "ownerDetails",
//         pipeline: [
//           {
//             $project: {
//               fullName: 1,
//               userName: 1,
//               avatar: 1,
//               _id: 0,
//             },
//           },
//         ],
//       },
//     },
//     {
//       $unwind: "$ownerDetails",
//     },
//     {
//       $addFields: {
//         fullName: "$ownerDetails.fullName",
//         userName: "$ownerDetails.userName",
//         avatar: "$ownerDetails.avatar",
//       },
//     },
//     {
//       $project: {
//         ownerDetails: 0, // remove nested object
//       },
//     },
//   ]);

//   res
//     .status(200)
//     .json(new ApiResponse(200, videos, "Videos fetched successfully"));
// });

const publishAVideo = asyncHandler(async (req, res) => {
  // get title and description from req.body
  // get thumbnail and video file from req.fields
  // get user from req.user which we validate through the middleware
  // validate title and description and files are present
  // validate user exists in db
  // upload video and thumbnail to cloudinary
  // create video document and user reference in db
  // return success response with video details

  //-------------------------//

  // get title and description from req.body

  const { title, description } = req.body;
  // validate title and description and files are present
  if (!(title && description)) {
    throw new ApiError(401, "Title and Description is required");
  }
  // get thumbnail and video file from req.fields
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  const videFileLocalPath = req.files?.videoFile[0]?.path;
  // console.log("thumbnailLocalPath---->", thumbnailLocalPath);
  // console.log("videFileLocalPath----->", videFileLocalPath);
  // validate title and description and files are present

  if (!(thumbnailLocalPath && videFileLocalPath)) {
    throw new ApiError(401, "Thumbnail and video file is Empty");
  }
  // upload video and thumbnail to cloudinary
  const thumbnail = await uploadOnCloudinar(thumbnailLocalPath);
  if (!thumbnail?.url) {
    throw new ApiError(401, "Clodinary error");
  }
  const videoFile = await uploadOnCloudinar(videFileLocalPath);
  if (!videoFile?.url) {
    throw new ApiError(401, "Clodinary error");
  }
  if (!videoFile?.duration) {
    throw new ApiError(401, "Clodinary error");
  }
  // console.log("Thumbnail---->", thumbnail);
  // console.log("videoFile------>", videoFile);
  // get user from req.user which we validate through the middleware

  // create video document and user reference in db
  const video = await Video.create({
    // title: videoFile?.original_filename,
    title,
    description,
    thumbnail: thumbnail.url,
    thumbnail_public_id: thumbnail.public_id,
    videoFile: videoFile.url,
    videoFile_public_id: videoFile.public_id,
    owner: req.user?._id,
    isPublished: 1,
    duration: videoFile.duration,
  });
  const postedBy = await User.findById(req.user?._id).select(
    "-password -refreshToken -email"
  );
  if (!postedBy) {
    throw new ApiError(401, "User does not exist");
  }
  // await video.save();
  // return success response with video details
  return res
    .status(200)
    .json(
      new ApiResponse(200, { video, postedBy }, "Video Uploaded Successfully")
    );
  // TODO: get video, upload to cloudinary, create video
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  console.log(videoId);
  if (!videoId) {
    throw new ApiError(101, "Video Id is missing");
  }
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "videoOwner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              userName: 1,
              avatar: 1,
              _id: 0,
            },
          },
        ],
      },
    },
    {
      $unwind: "$videoOwner",
    },
    {
      $project: {
        title: 1,
        description: 1,
        thumbnail: 1,
        videoFile: 1,
        views: 1,
        duration: 1,
        createdAt: 1,
        videoOwner: 1,
      },
    },
  ]);
  if (!video.length) {
    throw new ApiError(402, "Video is not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched Successfully"));
});

// const updateVideo = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
//   //TODO: update video details like title, description, thumbnail
// });

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video Id is not found");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video does not found");
  }
  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }
  // Delete video from Cloudinary
  try {
    // Delete video file
    await cloudinary.uploader.destroy(video.videoFile_public_id, {
      resource_type: "video",
    });

    // Delete thumbnail
    await cloudinary.uploader.destroy(video.thumbnail_public_id);
  } catch (error) {
    console.error("Cloudinary delete error:", error?.message);
    throw new ApiError(500, "Failed to delete files from Cloudinary");
  }

  const deletedVideo = await Video.findByIdAndDelete(videoId);
  const checkVideo = await Video.findById(videoId);
  if (checkVideo) {
    throw new ApiError(502, "Something went wrong while deleting the video");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video Deleted Successfully"));
  //TODO: delete video
});

// const togglePublishStatus = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
// });

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  // updateVideo,
  deleteVideo,
  // togglePublishStatus,
};
