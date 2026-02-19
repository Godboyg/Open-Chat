import mongoose from "mongoose";

const webPushSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  subscription: {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    }
  }
}, { timestamps: true });

export default mongoose.model("WebPushSubscription", webPushSchema);