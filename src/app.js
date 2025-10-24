import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("dev"));
// import routes
import userRouter from "./routes/user.routes.js";
app.use("/api/v1/users", userRouter);

import videoRouter from "./routes/video.routes.js";
app.use("/api/v1/videos", videoRouter);

import commentRoute from "./routes/comments.routes.js";
app.use("/api/v1/c", commentRoute);

import tweetsRoute from "./routes/tweets.routes.js";
app.use("/api/v1/t", tweetsRoute);
import subscriptionRoute from "./routes/subscriptions.routes.js";
app.use("/api/v1/channel", subscriptionRoute);

// http://localhost:8000/api/v1/users/register

export { app };
