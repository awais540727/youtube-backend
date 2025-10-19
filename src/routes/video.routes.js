// import { Router } from "express";
// import { verifyJWT } from "../middlewares/auth.middleware.js";
// import { upload } from "../middlewares/multer.middleware.js";

import express from "express";
import { JwtVerify } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { publishAVideo } from "../controllers/video.controllers.js";

const router = express.Router();

// router.use(JwtVerify); // Apply verifyJWT middleware to all routes in this file

// router
//   .route("/")
//   .get(getAllVideos)

router.route("/new-video").post(
  JwtVerify,
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

// router
//   .route("/:videoId")
//   .get(getVideoById)
//   .delete(deleteVideo)
//   .patch(upload.single("thumbnail"), updateVideo);

// router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;
