import mongoose from "mongoose";

const friendShipSchema = new mongoose.Schema({
    requester: { type: String },
    recipient: { type: String },
    conversationId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "conversation"
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "blocked", "rejected" , "unfrnd"],
      default: "pending"
    },

    createdAt: { type: Date, default: Date.now }
})

friendShipSchema.index(
  { requester: 1, recipient: 1 },
  { unique: true }
);

friendShipSchema.index(
  { requester: 1, recipient: 1 },
  {
    unique: true,
    partialFilterExpression: { requester: { $exists: true } }
  }
);

const friend = mongoose.models.friend || mongoose.model("friend", friendShipSchema);

export default friend;