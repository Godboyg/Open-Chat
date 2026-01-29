import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
    clientId: {
      type: String,
      unique: true
    },
    senderId: {
        type: String
    }, 
    name: {
        type: String
    },
    text: {
        type: String
    }
})

const Reply = mongoose.models.reply || mongoose.model("reply", replySchema);

export default Reply;