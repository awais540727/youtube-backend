import mongoose from "mongoose";
import { Playlist } from "../models/playlists.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

// const createPlaylist = asyncHandler(async (req, res) => {
//   // get name and description from req.body
//   // get user from req.user?._id, validate it from DB
//   // check playlist from DB if it is already exist
//   // create playlist in DB
//   // send response
//   //--------------------------------------------------//

//   // get name and description from req.body and validate it
//   const { name, description } = req.body;
//   if ([name, description].some((field) => field?.trim() === "")) {
//     throw new ApiError(401, "All fields are required");
//   }
//   // get user from req.user?._id, validate it from DB
//   const existingUser = await User.findById(req.user?._id);
//   if (!existingUser) {
//     throw new ApiError(404, "User does not found");
//   }
//   // check playlist from DB if it is already exist
//   const existingPlaylist = await Playlist.findOne({
//     name: name.toLowerCase(),
//   });
//   if (existingPlaylist) {
//     throw new ApiError(401, "Playlist already exist with the same name");
//   }
//   // create playlist in DB
//   const newPlaylist = await Playlist.create({
//     name,
//     description,
//   });
//   // save without validation for missing optional fields
//   await newPlaylist.save({ validateBeforeSave: false });
//   // send response
//   return res
//     .status(201)
//     .json(new ApiResponse(201, newPlaylist, "Playlist Created Successfully"));
// });

const createPlaylist = asyncHandler(async (req, res) => {
  // get name and description from req.body and validate it
  const { name, description } = req.body;
  //   if ([name, description].some((field) => field?.trim() === "")) {
  //     throw new ApiError(401, "All fields are required");
  //   }
  if (!name) {
    throw new ApiError(401, "All fields are required");
  }
  // get user from req.user?._id, validate it from DB
  const existingUser = await User.findById(req.user?._id);
  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  // check playlist from DB if it already exists
  const existingPlaylist = await Playlist.findOne({
    name: name.toLowerCase(),
  });
  if (existingPlaylist) {
    throw new ApiError(401, "Playlist already exists with the same name");
  }

  // create playlist instance (ignore videos & owner if missing)
  const newPlaylist = new Playlist({
    name,
    description: description ? description : null,
  });

  // save without validation for missing optional fields
  await newPlaylist.save({ validateBeforeSave: false });

  // send response
  return res
    .status(201)
    .json(new ApiResponse(201, newPlaylist, "Playlist Created Successfully"));
});

export { createPlaylist };
