import conversation from "../models/conversation.js";
import Message from "../models/messages.js";

export const allMessages = async({ query }: any) => {
    try{
        const activeId = query.activeId;
        console.log("active id",activeId);

        if (!activeId) {
          throw new Error("Conversation ID is required")
        }

        const messages = await Message.find({
            conversationId: activeId
        }).sort({ createdAt: 1 }).populate("reply");

        return { message:"All messages are" , messages }
    } catch(Error) {
        console.log("error",Error);
    }
}