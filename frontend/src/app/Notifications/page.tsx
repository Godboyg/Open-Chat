"use client"
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { addNotification, markAllRead, NotificationN } from '@/redux/notificationSlice';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image';
import { getSocket } from '@/lib/socket';
import toast, { Toaster } from 'react-hot-toast';
import { formatMessageDateHeader } from '@/lib/dateHeader';
import { addFriend, addFriendRequest, Friend, removeFriend, removeFriendRequest } from '@/redux/friendSlice';
import { upsertConversation } from '@/redux/conversationSlice';
import { motion } from "motion/react";

function page() {

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
    const socketRef = useRef<null | WebSocket>(null)
    const [loading , setLoading] = useState<boolean>(true)

    useEffect(() =>{
        const socket = getSocket();
        socketRef.current = socket;

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if(data.type === "user-unfrnd"){
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
        }
    },[])

    useEffect(() => {
        if(!socketRef.current) return;

        if(socketRef.current?.readyState === 1){
            socketRef.current?.send(JSON.stringify({ type:"user-online", session }));
            socketRef.current?.send(JSON.stringify({ type:"mark-n", session }));
            if(session?.user.internalId) {
                dispatch(markAllRead(session?.user?.internalId));
            }
        }
    },[status])

    useEffect(() => {
        if(!session) return

        const allNotification = async() => {
            try{
                const res = await axios.get("/api/app/notification", {
                    params: {
                        userId: session?.user.internalId
                    }
                })

                const result = res.data.data;
                console.log("result",result);
                if(result.length > 0) {
                    console.log("adding")
                    const formattedNotification = 
                    result.length > 0 ? result.map((n: any) => ({
                        _id: session.user.internalId,
                        type: n.notify.type,
                        message: n.notify.message,
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
                }
            } catch(err) {
                console.log("error",err);
            }
        }

        allNotification();
    },[status])

    const handleUnFrnd = (fnd: Friend) => {
        try{
            if(!socketRef.current){
                toast.error("error pls try again");
            }
            socketRef.current?.send(JSON.stringify({ type:"unFrnd" , session , fnd }))
        } catch(error) {
            console.log("error",error);
        }
    }

    const handleAccept = (val: NotificationN) => {
        try {
            if(socketRef.current?.readyState === 1){
                socketRef.current?.send(JSON.stringify({ 
                    type:"friend-request-accepted",
                    to: val._id , from: val.otherUser?.uniqueId
                }))
            } else {
                toast.error("failed to accept try again!");
            }
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
            {
                notification.length > 0 ? (
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
                            <div className="">
                                {showDateDivider && (
                                   <div className="flex justify-start my-3">
                                     <span className="px-3 py-1 text-xs text-gray-500 bg-gray-200 rounded-full">
                                       {currentDate}
                                     </span>
                                   </div>
                                 )}
                            </div>
                            <div className="inline-flex items-center gap-4 rounded-lg w-full" key={index}>
                                <div className="">
                                    <Image 
                                      src={notify.otherUser?.image ? notify.otherUser.image : ""}
                                      alt='User'
                                      height={45}
                                      width={45}
                                      className='object-cover rounded-full'
                                    />
                                </div>
                                 <div className="text-sm  px-2 py-1 text-white w-full break-words break-all whitespace-normal leading-snug">
                                   <span className='font-bold text-md'>{notify.otherUser?.name}</span>
                                    {
                                    friends.map((fnd: Friend) => (
                                        fnd._id === notify?.otherUser?.uniqueId && (
                                            <span className='ml-2'>u r frnds.</span>
                                        )
                                    ))
                                    }
                                    {
                                        requests.map((req) => (
                                            req.to === notify.otherUser?.uniqueId && notify.message === "REQUEST_RECEIVED" && req._id && (
                                                <span className='ml-2'>requested frnd request to you.</span>
                                            )
                                        ))
                                    }
                                    {
                                        requests.map((req) => (
                                            req.to === notify.otherUser?.uniqueId && notify.message === "REQUEST_SENT" && req._id && (
                                                <span className='ml-2'>you requested to be friends.</span>
                                            )
                                        ))
                                    }
                                 </div>
                                   <div className="bg-blue-500 rounded-md">
                                 {
                                    friends.map((fnd: Friend) => (
                                        fnd._id === notify?.otherUser?.uniqueId && notify.message === "REQUEST_RECEIVED" && (
                                            <div className="px-3 py-1.5 text-sm hover:cursor-pointer"
                                            onClick={() => handleUnFrnd(fnd)}>
                                                UnFrnd
                                            </div>
                                        ) 
                                        ))
                                 }
                                 {
                                    friends.map((fnd: Friend) => (
                                        fnd._id === notify?.otherUser?.uniqueId && notify.message === "REQUEST_SENT" && (
                                            <div className="px-3 py-1.5 text-sm hover:cursor-pointer"
                                            // onClick={() => handleUnFrnd(fnd)}
                                            >
                                                Friends
                                            </div>
                                        ) 
                                        ))
                                 }
                                  {
                                    requests.map((req) => (
                                        req.to === notify.otherUser?.uniqueId && notify.message === "REQUEST_RECEIVED" && (
                                            <button 
                                            className='px-3 hover:cursor-pointer py-1.5 text-sm hover:pointer'
                                            onClick={() => handleAccept(notify)} 
                                            >
                                                Accept
                                            </button>
                                        )
                                    ))
                                  }
                                  {
                                    requests.map((req) => (
                                        req.to === notify.otherUser?.uniqueId && notify.message === "REQUEST_SENT" && req._id && (
                                            <button 
                                            className='px-3 hover:cursor-pointer py-1.5 text-sm hover:pointer'
                                            // onClick={() => handleAccept(notify)} 
                                            >
                                                Pending
                                            </button>
                                        )
                                    ))
                                  }
                                   </div>
                               </div>
                            </>
                        )
                    })
                ) : (
                    <div className="">
                        {
                        Text && (
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
  )
}

export default page