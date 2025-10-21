import express from "express";
import { JwtVerify } from "../middleware/auth.middleware.js";
import {
  addComment,
  getVideoComments,
} from "../controllers/comments.controllers.js";

const router = express.Router();

router.use(JwtVerify); // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId").get(getVideoComments).post(addComment);

export default router;
