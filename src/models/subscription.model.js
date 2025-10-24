import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

subscriptionSchema.pre("save", function (next) {
  if (this.subscriber.equals(this.channel)) {
    return next(new Error("User cannot subscribe to themselves"));
  }
  next();
});

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
