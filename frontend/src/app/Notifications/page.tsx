"use client"
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { addNotification, markAllRead, NotificationN } from '@/redux/notificationSlice';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image';
import { getSocket , subscribe , emit } from '@/lib/socket';
import toast, { Toaster } from 'react-hot-toast';
import { formatMessageDateHeader } from '@/lib/dateHeader';
import { addFriend, addFriendRequest, Friend, removeFriend, removeFriendRequest } from '@/redux/friendSlice';
import { upsertConversation } from '@/redux/conversationSlice';
import { motion } from "motion/react";
import { subscribeToPush } from '@/lib/push';

const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function Page() {

    const mode = useAppSelector((state) => state.theme.mode);
    const dispatch = useAppDispatch();
    const { data: session , status } = useSession();
    const notification = useAppSelector((state) => state.notifications.items)
    console.log("not",notification);
    const Text = "No Notification".split(" ");
    const friends = useAppSelector((state) => state.friends.friends);
    const requests = useAppSelector((state) => state.friends.requests);
    console.log("all friends",friends);
    console.log("all requests",requests);
    const [loading , setLoading] = useState<boolean>(true)
    const [isLoading , setisLoading] = useState<boolean>(false);
    function convertToISTTime(utcISOString: any) {
  return new Date(utcISOString)
    .toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    })
    .toLowerCase();
}

    useEffect(() =>{
        getSocket();

        const unsubscribe = subscribe((data: any) => {
            console.log("data on message on notification page",data);
            if(data.type === "user-unfrnd"){
                setLoading(false);
                dispatch(removeFriend({
                    _id: data.to
                }));
                dispatch(addFriendRequest({
                    _id: data.sender,
                    to: data.to,
                    status: "pending"
                }))
                console.log("u were frnd by the user", data.newFriend);
            } else if(data.type === "unfrnd") {
                console.log("iddd",data.to);
                dispatch(removeFriend({
                    _id: data.to,
                }));
                dispatch(addFriendRequest({
                    _id: data.sender,
                    to: data.to,
                    status: "pending"
                }))
                dispatch(removeFriendRequest(data.to))
                console.log("u unfrnd the user", data.newFriend)
            } else if(data.type === "request-accepted") {
               dispatch(addFriend({
                   _id: data._id,
                   status: data.status,
                   conversationId: data.conversationId
               }));
               console.log(data._id , data);
               dispatch(removeFriendRequest({ to: data._id , from: data.from }));
               const upsert = {
                   convo : {
                        _id: data.conversationId,
                        participents: [data._id , data.from]
                    }
                }
                dispatch(upsertConversation(upsert));
            }
        })

        return () => unsubscribe()
    },[])

    useEffect(() => {
        const fn = async() => {
          try{
            let subscription = await subscribeToPush(key ? key : "");
            emit({ type:"user-online", session , subscription });
            emit({ type:"mark-n", session });
            if(session?.user.internalId) {
              dispatch(markAllRead(session?.user?.internalId));
            } 
          } catch(err) {
            toast.error("pls refresh!");
          }
        }

        fn();
    },[status])

    useEffect(() => {
        if(!session) return;

        const allNotification = async() => {
            try{
                const res = await axios.get("/api/app/notification", {
                    params: {
                        userId: session?.user.internalId
                    }
                })

                const result = res.data.data;
                console.log("result",result);
                if(result) {
                    setLoading(false);
                }
                if(result.length > 0) {
                    console.log("adding")
                    const formattedNotification = 
                    result.length > 0 ? result.map((n: any) => ({
                        _id: session.user.internalId,
                        type: n.notify.type,
                        message: n.notify.message,
                        createdAt: n.notify.createdAt,
                        read: true,
                        otherUser: {
                            image: n.otherUser.image,
                            name: n.otherUser.fullName,
                            uniqueId: n.otherUser.uniqueUserId,
                        },
                        notify: {
                            createdAt: n.notify.createdAt
                        }
                    })) : [];
                    
                    if(formattedNotification.length > 0) {
                        console.log("added")
                        dispatch(addNotification(formattedNotification));
                    }

                    if (result.length > 0) {
                       result.forEach((n: any) => {
                         if(!n.notify.conversationId) {
                             dispatch(
                               addFriendRequest({
                                 _id: n.notify._id,
                                 to: n.notify.to || n.notify.from,
                                 status: "pending",
                               })
                             );
                         }
                       });
                    }
                }
            } catch(err) {
                console.log("error",err);
            }
        }

        allNotification();
    },[status])

    const handleUnFrnd = (fnd: Friend) => {
        try{
            emit({ type:"unFrnd" , session , fnd });
        } catch(error) {
            console.log("error",error);
        }
    }

    const handleAccept = (val: NotificationN) => {
        try {
           setisLoading(true);
            emit({ 
                type:"friend-request-accepted",
                to: val._id , from: val.otherUser?.uniqueId
            })
            console.log("to: from:",val._id ,val.otherUser?.uniqueId)
        } catch(Error) {
            console.log("Errr",Error);
        }
    }

  return (
    <div className={`h-screen w-full flex items-center justify-center ${mode ? "bg-black text-white" : "bg-white text-black"}`}>
        <Toaster />
        <div className="h-screen px-1 py-3 flex flex-col gap-2 lg:w-[60%] w-[95%]">
            <div className="">
                <h2 className='font-bold text-xl'>Notifications</h2>
            </div>
            <div className="h-[90%] overflow-auto flex flex-col">
              {
                !loading && notification.length > 0 ? (
                    notification.map((notify, index) => {

                        const currentDate = formatMessageDateHeader(notify?.notify?.createdAt);
                        console.log("ciurre",currentDate);
                        
                        const previousDate =
                           index > 0
                          ? formatMessageDateHeader(notification[index - 1]?.notify?.createdAt)
                          : null;
                    
                          const showDateDivider = index === 0 || currentDate !== previousDate;

                        return (
                            <>
                            <div className="px-1">
                              <div className=""
                            key={index}>
                                {showDateDivider && (
                                   <div className="flex justify-start my-3">
                                     <span className="px-3 py-1 text-xs text-gray-500 bg-gray-200 rounded-full">
                                       {currentDate}
                                     </span>
                                   </div>
                                 )}
                            </div>
                            <div className="inline-flex items-center gap-4 rounded-lg w-full" key={index}>
                                <div className="flex items-center w-full">
                                  <div className="">
                                    <Image 
                                      src={notify.otherUser?.image ? notify.otherUser.image : ""}
                                      alt='User'
                                      height={40}
                                      width={40}
                                      className='object-cover rounded-full'
                                    />
                                </div>
                                 <div className="text-sm  px-2 py-1 text-white w-full break-words break-all whitespace-normal leading-snug">
                                   <span className='font-bold text-md'>{notify.otherUser?.name}</span>
                                    {
  friends.some(
    (fnd: Friend) => fnd._id === notify?.otherUser?.uniqueId
  ) ? (
    <span className="ml-2">
      and you are friends.
        <small className="ml-3 text-gray-500">{convertToISTTime(notify.createdAt ? notify.createdAt : "")}</small>
    </span>
  ) : notify?.message === "REQUEST_SENT" ? (
    <span className="ml-2">
      you requested to be friends.
        <small className="ml-3 text-gray-500">{convertToISTTime(notify.createdAt ? notify.createdAt : "")}</small>
    </span>
  ) : notify?.message === "REQUEST_RECEIVED" ? (
    <span className="ml-2">
      sent friend request to you.
        <small className="ml-3 text-gray-500">{convertToISTTime(notify.createdAt ? notify.createdAt : "")}</small>
    </span>
  ) : null
}
                                 </div>
                                </div>
                                   <div className="bg-blue-500 rounded-md">
                                       {
  friends.some(
    (fnd: Friend) => fnd._id === notify?.otherUser?.uniqueId
  ) ? (
    notify?.message === "REQUEST_SENT" ? (
      <div className="px-3 py-1.5 text-sm hover:cursor-pointer">
        Friends
      </div>
    ) : notify?.message === "REQUEST_RECEIVED" ? (
      <div
        className="px-3 py-1.5 text-sm hover:cursor-pointer"
        onClick={() => handleUnFrnd(
          friends.find(
            (fnd: Friend) => fnd._id === notify?.otherUser?.uniqueId
          )!
        )}
      >
        UnFriend
      </div>
    ) : null
  ) : notify?.message === "REQUEST_RECEIVED" ? (
    <button
      className="px-3 py-1.5 text-sm hover:cursor-pointer"
      onClick={() => handleAccept(notify)}
    >
      {
        isLoading ? (
          <div className="w-3 h-3 border-3 border-gray-700 border-t-cyan-500 rounded-full animate-spin"></div>
        ) : (
          <span>Accept</span>
        )
      }
    </button>
  ) : notify?.message === "REQUEST_SENT" ? (
    <button className="px-3 py-1.5 text-sm hover:cursor-pointer">
      Requested
    </button>
  ) : null
}
                                   </div>
                            </div>
                            </div>
                            </>
                        )
                    })
                ) : (
                    <div className="">
                        {
                            loading && <div className="w-full mt-10 flex items-center justify-center">
                              <div className="w-4 h-4 border-3 border-gray-800 border-t-cyan-600 rounded-full animate-spin"></div>
                            </div>
                        }
                        {
                        !loading && Text && (
                         <p className="text-2xl font-bold flex gap-2 justify-center items-center h-32">
                               {Text.map((word, index) => (
                               <motion.div
                                   key={index}
                                   initial={{ opacity: 0, filter:"blur(15px)", y: -10 }}
                                   animate={{ opacity: 1, filter:"blur(0px)" ,y: 0 }}
                                   transition={{ delay: index * 0.8, duration: 0.8}}
                                   className="text-gray-500"
                               >
                                   {word}
                               </motion.div>
                               ))}
                           </p>
                           )
                        }
                    </div>
                )
            }
            </div>
        </div>
    </div>
  )
}

export default Page