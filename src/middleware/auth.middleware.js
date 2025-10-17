import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import JWT from "jsonwebtoken";
const JwtVerify = asyncHandler(async (req, _, next) => {
  try {
    // Find Token from cookies or Headers
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorize User");
    }
    // Decode Token Using JWT
    const decodedToken = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // Find User by using user decoded ID
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Invalid Access Token -m");
    }
    // Add user in the req
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token catch -m");
  }
});

export { JwtVerify };
