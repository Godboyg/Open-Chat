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
    friendKey: {
        type: String,
        unique: true,
        sparse: true
    },
    lastMessage: {
        text: {
            type: String
        },
        senderId: {
            type: String
        },
        createdAt: {
            type: Date
        },
        isRead: {
            type: Boolean
        }
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
})

const conversation = mongoose.models.conversation || mongoose.model("conversation" , conversationSchema);

export default conversation;