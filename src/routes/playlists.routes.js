import { Router } from "express";
import { createPlaylist } from "../controllers/playlists.controllers.js";
import { JwtVerify } from "../middleware/auth.middleware.js";

const router = Router();

router.use(JwtVerify); // Apply verifyJWT middleware to all routes in this file

router.route("/create-playlist").post(createPlaylist);

export default router;
