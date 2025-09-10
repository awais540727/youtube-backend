import dotenv from "dotenv";
import connectDB from "./db/db.js";
import express from "express";
dotenv.config();

const app = express();
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`SERVER is running at ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MONGO_DB Connection failed");
  });
