import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logOutUser,
  refreshAccessToken,
  registerUser,
  uodateUserAvatar,
  uodateUserCoverImage,
  updateAccount,
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
// router.route("/user-profile/:userName").get(JwtVerify, getUserChannelProfile);
router.route("/update-user-profile").patch(JwtVerify, updateAccount);

router.route("/get-current-user").get(JwtVerify, getCurrentUser);

router
  .route("/update-avater")
  .patch(JwtVerify, upload.single("avatar"), uodateUserAvatar);

router
  .route("/update-coverImage")
  .patch(JwtVerify, upload.single("coverImage"), uodateUserCoverImage);

router
  .route("/get-user-channel-profile/:userName")
  .get(JwtVerify, getUserChannelProfile);

router.route("/get-watch-history").get(JwtVerify, getWatchHistory);
// router.get("/login", loginUser);

export default router;
