// import { Router } from "express";
// import { verifyJWT } from "../middlewares/auth.middleware.js";
// import { upload } from "../middlewares/multer.middleware.js";

import express from "express";
import { JwtVerify } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  updateVideo,
  updateVideoFile,
  updateVideoThumbnail,
} from "../controllers/video.controllers.js";

const router = express.Router();

router.use(JwtVerify); // Apply verifyJWT middleware to all routes in this file

router.route("/all-videos").get(getAllVideos);

router.route("/new-video").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);

router.route("/:videoId").get(getVideoById);
router.route("/:videoId").delete(deleteVideo);
router.route("/:videoId").patch(updateVideo);
router
  .route("/thumbnail/:videoId")
  .patch(upload.single("thumbnail"), updateVideoThumbnail);
router
  .route("/videoFile/:videoId")
  .patch(upload.single("videoFile"), updateVideoFile);

export default router;
