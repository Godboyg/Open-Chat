import mongoose from "mongoose"

const conversationSchema = new mongoose.Schema({
    type: { 
        type: String,
        enum: ["direct", "group"],
        default: "direct"
    },
    participents: [{
        type: String
    }],
    lastMessage: {
        text: {
            type: String
        },
        senderId: {
            type: String
        },
        createdId: {
            type: Date
        }
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
})

conversationSchema.index(
  { type: 1, participents: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "direct" }
  }
);

const conversation = mongoose.models.conversation || mongoose.model("conversation" , conversationSchema);

export default conversation;
