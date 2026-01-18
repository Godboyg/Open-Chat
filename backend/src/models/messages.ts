import mongoose , { Types } from "mongoose"
import conversation from "./conversation.js"
import { DeliveryState } from "../ws/websocket.js";

export interface IMessage {
  clientMessageId: string;
  conversationId: Types.ObjectId;
  senderId: string;
  receiversId: string[];
  text: string;
  deliveryStatus: Map<string, DeliveryState>;
  type: string;
  seenBy: string[];
  createdAt: Date;
}

const MessageSchema = new mongoose.Schema<IMessage>({
    clientMessageId: {
      type: String
    },
    conversationId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "conversation"
    },
    senderId: {
        type: String
    },
    text: {
        type: String
    },
    receiversId: [{
        type: String
    }],
    // status: { 
    //     type: String ,
    //     enum: ["sending" , "sent" , "delivered" , "read"],
    //     default: "sending"
    // },
    deliveryStatus: {
     type: Map,
     of: {
        type: String,
        enum: ['sent' , 'delivered', 'read'],
        default: 'sent'
     }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    type: {
     type: String,
     enum: ["text", "image", "file", "call"],
     default: "text",
    }
},{ timestamps: true })

const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);

export default Message;