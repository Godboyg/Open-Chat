import notification from "../models/notification.js";
import User from "../models/user.js";

type props = {
    query: String
}

export const allNotification = async({ query }: any) => {
    try{
        const userId = query.userId;
        console.log("userid", userId);
        const AllNotification = await notification.find({
            userId
        })

        const result = await Promise.all(
            AllNotification.map(async(notify) => {
                if(notify.message === "REQUEST_RECEIVED") {
                    const other = notify.from
                
                    if(!other) return;

                    const otherUser = await User.findOne({
                        uniqueUserId: other,
                    })

                    return {
                        notify, 
                        otherUser
                    }
                } else if(notify.message === "REQUEST_SENT") {
                    const other = notify.to
                
                    if(!other) return;

                    const otherUser = await User.findOne({
                        uniqueUserId: other,
                    })

                    return {
                        notify, 
                        otherUser
                    }
                }
            })
        )

        return { message: "got it" ,
            data: result.filter(Boolean) 
         }
    } catch(Error) {
        console.log("error",Error);
    }
}