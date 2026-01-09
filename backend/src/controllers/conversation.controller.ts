import conversation from "../models/conversation.js";
import Message from "../models/messages.js";
import User from "../models/user.js";

export const allConversation = async({ query }: any) => {
    try{
        const userId = query.userId;
        console.log("userid!!!1",userId);
        const conversations = await conversation.find({
            participents: userId
        })

        console.log("pario",conversations);

        const result = await Promise.all(
          conversations.map(async (convo: any) => {
            const otherUserId = convo.participents.find(
              (id: any) => id !== userId
            )

            if (!otherUserId) return null;

            const user = await User.findOne({
              uniqueUserId: otherUserId,
            });

            const message = await Message.countDocuments({
              conversationId: convo._id,
              receiversId: userId,
              $or: [
                {
                [`deliveryStatus.${userId}`]: "delivered"
                },
                {
                [`deliveryStatus.${userId}`]: "sent"
                }
              ]
            })

            return { 
              convo,
              otherUser: user,
              message: message
            }
          })
        )

        return { message: "all conversation" , 
               data: result.filter(Boolean) 
        }
    } catch(error) {
        console.log("errro",error);
    }
}