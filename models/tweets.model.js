import mongoose from "mongoose";

const tweetsSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: [true, "Ownwer is required"],
    },
    content: {
      type: String,
      required: [true, "Content is Empty"],
    },
  },
  { timestamps: true }
);

export const Tweet = mongoose.model("Tweet", tweetsSchema);
