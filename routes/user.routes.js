import {
  changeCurrentPassword,
  getUserChannelProfile,
  loginUser,
  logOutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controllers.js";
import express from "express";
import { upload } from "../middleware/multer.middleware.js";
import { JwtVerify } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// Secure Routes

router.route("/logout").post(JwtVerify, logOutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(JwtVerify, changeCurrentPassword);
// router.route("/user-profile/:userName").get(getUserChannelProfile);
router.route("/user-profile/:userName").get(JwtVerify, getUserChannelProfile);

// router.get("/login", loginUser);

export default router;
