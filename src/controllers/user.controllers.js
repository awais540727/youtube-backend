import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinar } from "../utils/Cloudinary.js";
import JWT from "jsonwebtoken";
import mongoose from "mongoose";
const generateAccessAndRefreshTokens = async (uderId) => {
  try {
    const user = await User.findById(uderId);
    const accessToken = user?.createAccessToken();
    const refreshToken = user?.createRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something wnet wrong while generating the Access and Refresh Tokens"
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  const { fullName, email, userName, password } = req.body;

  // Validation like not empty fields
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check if user already exist through username, email
  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (existedUser) {
    throw new ApiError(409, "User Already Exist");
  }
  // upload images to cloudinary like avatar
  // console.log("Body --->", req.body);
  // console.log("Files --->", req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const avatarLocalPath = req.files?.avatar?.[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const coverImage = await uploadOnCloudinar(coverImageLocalPath);
  const avatar = await uploadOnCloudinar(avatarLocalPath);
  // check for images, avatar is compulslury
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }
  // Create user in mongoDB server
  const user = await User.create({
    fullName,
    userName,
    password,
    avatar: avatar.url,
    email,
    coverImage: coverImage?.url || "",
  });
  // check if user created successfully
  const createdUser = await User.findById(user._id).select(
    // remove password and refresh token
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // return response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "Created Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body --> data
  const { userName, email, password } = req.body;
  // username or email
  if (!(userName || email || password)) {
    throw new ApiError(400, "UserName or Email is Required");
  }
  // if (!userName && !email) {
  //   throw new ApiError(400, "UserName or Email is Required");
  // }
  // find user from DB
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  // verify and check password
  const isPasswordValid = user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Password did not match");
  }
  // access cookie and refreshToken
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  // send cookie
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User LoggedIn Successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  // First remove refreshToken from DB, To remove it we need middleware to access user
  console.log("UserId --->", req.user._id);

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  // clear both cookies
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // Extract refresh token from cookies
  // decode refresh token using jwt
  // After decoding find user from the database
  // check both tokens if they are equal I mean if the token extracted from the cookie and the token which is stored in DB is equal then the user is authorized and generate new token for him
  // id both token are same then generate new token for him
  // send the response and save the token in cookies

  //-------------------------------------------//
  // Extract refresh token from cookies
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incommingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    // decode refresh token using jwt
    const decodedRefreshToken = JWT.verify(
      incommingRefreshToken,
      REFRESH_TOKEN_SECRET
    );
    // After decoding find user from the database
    const user = await User.findById(decodedRefreshToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }
    // check both tokens if they are equal I mean if the token extracted from the cookie and the token which is stored in DB is equal then the user is authorized and generate new token for him
    if (incommingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired");
    }
    // id both token are same then generate new token for him
    const { accessToken, newRefreshToken } = generateAccessAndRefreshTokens(
      user?._id
    );
    const options = {
      httpOnly: true,
      secure: true,
    };
    // send the response and save the token in cookies
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Token Refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  // Extract Old and New Password from req.body
  // find user from the DB using req.user which we saved while doing login
  // compare old password using method isPasswordCorrect
  // replce old password of DB with new
  // send response
  //----------------------------------//

  // Extract Old and New Password from req.body
  const { oldPassword, newPassword } = req.body;
  console.log(oldPassword, "-----", newPassword);
  // console.log(req.user);
  // console.log(req.user._id);
  // find user from the DB using req.user which we saved while doing login
  const newUser = await User.findById(req.user?._id);
  if (!newUser) {
    throw new ApiError(401, "Unauthorized User");
  }
  // compare old password using method isPasswordCorrect
  const isPasswordCorrect = await newUser.isPasswordCorrect(oldPassword);
  console.log("isPasswordCorrect :--->", isPasswordCorrect);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password");
  }
  // replce old password of DB with new
  newUser.password = newPassword;
  await newUser.save({ validateBforeSave: false });
  // send response
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password CHnaged Successfully"));
});

const updateAccount = asyncHandler(async (req, res) => {
  // get details for update from the body
  // find and update user from the DB using req.user which we saved while doing login
  // send response
  //-------------------------------//
  // get details for update from the body
  const { fullName, email } = req.body;
  // find and update user from the DB using req.user which we saved while doing login
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");
  if (!user) {
    throw new ApiError(401, "Unauthorized user");
  }
  // send response
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Successfully Updated"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // find user from the DB using req.user which we saved while doing login
  // send response
  //--------------------------------------//
  // find user from the DB using req.user which we saved while doing login
  const user = User.findById(req.user?._id).select("-password");
  if (!user) {
    throw new ApiError(401, "Unauthorized user");
  }
  // send response
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User Found Successfully"));
});

const uodateUserAvatar = asyncHandler(async (req, res) => {
  // extract local avatar path using req.file?.path which will be send through multer middleware
  // validate path
  // upload on cloudinary
  // find and update user from the DB using req.user which we saved while doing login
  // Update URL of avatar in DB
  // send response

  //--------------------------------------------//
  // extract local avatar path using req.file?.path which will be send through multer middleware
  const avatarLocalPath = req.file?.path;
  // validate path

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  // upload on cloudinary

  const avatar = await uploadOnCloudinar(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on Cludinary");
  }
  // find and update user from the DB using req.user which we saved while doing login

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      // Update URL of avatar in DB
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  // send response
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
});
const uodateUserCoverImage = asyncHandler(async (req, res) => {
  // extract local avatar path using req.file?.path which will be send through multer middleware
  // validate path
  // upload on cloudinary
  // find and update user from the DB using req.user which we saved while doing login
  // Update URL of avatar in DB
  // send response
  //--------------------------------------------//
  // extract local coverImage path using req.file?.path which will be send through multer middleware
  const coverImageLocalPath = req.file?.path;
  // validate path
  if (!coverImageLocalPath) {
    throw new ApiError(400, "CoverImage file is missing");
  }
  // upload on cloudinary
  const coverImage = await uploadOnCloudinar(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading cover Image on Cloudinary");
  }
  // find and update user from the DB using req.user which we saved while doing login
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      // Update URL of avatar in DB
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");
  // send response
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated Successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  // extract userName from req.params
  // find user from the DB using aggregate function using userName
  // send response
  //----------------------------------//
  // extract userName from req.params
  // console.log(req.params);
  const { userName } = req.params;
  // console.log(userName);
  if (!userName?.trim()) {
    throw new ApiError(400, "UserName is missing");
  }

  // find user from the DB using aggregate function using userName
  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.trim().toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        userName: 1,
        fullName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist");
  }
  // send response
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User Channel fetched Successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    avatar: 1,
                    userName: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History get Successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccount,
  uodateUserAvatar,
  uodateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
