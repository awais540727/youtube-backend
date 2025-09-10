import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectDB = async () => {
  try {
    const connect = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    console.log(`Connected to MongoDB : HOST : ${connect.connection.host}`);
    // console.log("DB connection => ", connect);
  } catch (error) {
    console.log("Error in DB connection", error);
    process.exit(1);
  }
};

export default connectDB;
