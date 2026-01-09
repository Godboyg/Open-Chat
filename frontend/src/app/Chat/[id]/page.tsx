"use client"
import React, {  useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import 'remixicon/fonts/remixicon.css'
import { getSocket } from '@/lib/socket';
import { useSession } from 'next-auth/react';
import { addMessage, markMessagesRead, setMessages } from '@/redux/messageSlice';
import { updateLastMessage } from '@/redux/conversationSlice';
import axios from 'axios';
import Image from 'next/image';
import Typing from './Typing';
import { motion } from 'motion/react';
import { setUserOnline } from '@/redux/themeSlice';
import { formatLastActive } from '@/lib/LastActive';
import { formatMessageDateHeader } from '@/lib/dateHeader';
import toast from 'react-hot-toast';

function page() {

    const chatRef = useRef<HTMLDivElement | null>(null);
    const [msg , setMsg] = useState<string>("");
    const activeId = useAppSelector((state) => state.conversations.activeId);
    console.log("activeid",activeId);
    const dispatch = useAppDispatch();
    const { data: session , status } = useSession();
    const socketRef = useRef<WebSocket | null>(null)
    const [typing , setTyping] = useState<boolean>(false);
    const [notFriend , setNotFriend] = useState<boolean>(false);

    const mode = useAppSelector((state) => state.theme.mode);
    const messages = useAppSelector((state) =>
        state.messages.byConversationId[activeId ? activeId : ""]
     ) || [];
     const otherUser = useAppSelector((state) => state.conversations.byId[activeId ? activeId : ""]);
     console.log("other uwer",otherUser);
     const allOnlineUsers = useAppSelector((state) => state.theme.users);
     const lastMessage = messages.at(-1);
     console.log("jhaevf",lastMessage);

    console.log("messages",messages);

    useEffect(() => {
        const socket = getSocket();
        socketRef.current = socket;
        console.log("socket in chat",socket);
    
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if(data.type === "MISSED_MESSAGES"){
                console.log("msg missed",data.msg);
            } else if(data.type === "message received"){
                socketRef?.current?.send(JSON.stringify({ type: "seen" , activeId , session , msg: data.msg }))
                console.log("in the page/room");
                console.log("msg", data.msg);
                dispatch(addMessage({
                 _id: crypto.randomUUID(),
                 conversationId: data.msg.conversationId,
                 senderId: data.msg.senderId,
                 text: data.msg.text,
                 createdAt: data.msg.createdAt,
                 status: "sent" 
                }));
                dispatch(updateLastMessage({
                  conversationId: data.msg.conversationId,
                  lastMessage: {
                      text: data.msg.text,
                      senderId: data.msg.senderId,
                      createdAt: data.msg.createdAt
                  }
                }));
            } else if(data.type === "Typing") {
                setTyping(true);
            } else if(data.type === "Typing-stop") {
                setTyping(false);
            } else if(data.type === "ONLINE_USERS"){
                dispatch(setUserOnline(data.users));
                console.log("online users []",data.users);
            } else if(data.type === "ONLINE_USERS_AFTER"){
                dispatch(setUserOnline(data.users));
                console.log("data.payload.after",data.users)
            } else if(data.type === "msg-seen"){
                console.log("seen", data.msg);
                dispatch(markMessagesRead({ conversationId: data.msg.conversationId, userId: data.msg.senderId }))
            } else if(data.type === "now-seen"){
                console.log("now seen just", data.unReadMsg)
                dispatch(markMessagesRead({ conversationId: activeId, userId: data.senderId }))
            } else if(data.type === "unread-msg") {
                console.log("un read msg",data.unReadMsg);
                socketRef?.current?.send(JSON.stringify({ type: "now seen" , activeId , senderId: data.senderId}))
                if(data.unReadMsg.length > 0){
                    dispatch(setMessages({
                     conversationId: activeId ? activeId : "",
                     messages: data.unReadMsg,
                    }))
                }
            } else if(data.type === "seen-now") {
                console.log("seen just now");
               dispatch(markMessagesRead({ conversationId: data.activeId, userId: data.senderId }))
            } else if(data.type === "cannot-msg") {
                setNotFriend(true);
                console.log("user rejected the request");
            } else if(data.type === "cannot-msg-add") {
                setNotFriend(true);
                console.log("add first then u can msg");
            }
        }
    },[])

    useEffect(() => {
        if(!socketRef.current) return;

        if(socketRef?.current && socketRef.current.readyState === 1){
            socketRef?.current?.send(JSON.stringify({ type: "msg read" , activeId , session }))
        }
    },[messages])

    useEffect(() => {
            if(!socketRef.current) return;
    
            if(socketRef.current.readyState === 1){
                socketRef.current.send(JSON.stringify({ type:"user-online", session }))
                socketRef.current.send(JSON.stringify({ type: "msg read" , activeId , session }))
                socketRef.current.send(JSON.stringify({ type: "msg read online" , activeId , session }))
            }
    },[socketRef , status])

    const handleSendMsg = () => {
        try{
            const now = new Date();
            const message = {
                text: msg,
                activeId: activeId,
                type: "message sent",
                timeStamp: now.getTime(),
                senderId: session?.user.internalId,
            }

            if(activeId){
                dispatch(addMessage({
                 _id: crypto.randomUUID(),
                 conversationId: activeId,
                 senderId: session?.user.internalId,
                 text: msg,
                 createdAt: Date.now()
                }));

                dispatch(updateLastMessage({
                    conversationId: activeId,
                    lastMessage: {
                        text: msg,
                        senderId: session?.user.internalId,
                        date: Date.now()
                    }
                }))
            }
            if(socketRef.current?.readyState === 1) {
                socketRef.current?.send(JSON.stringify(message));
            } else {
                toast.error("socket not connected try again!");
            }
            setMsg("");
        } catch(error) {
            console.log("error",error);
        }
    }

    useEffect(() => {
     if (chatRef.current) {
       chatRef.current.scrollTop = chatRef.current.scrollHeight;
     }
   }, [messages]);

    useEffect(() => {
        if(!socketRef.current) return;

        if(msg.length > 0) {
            socketRef.current.send(JSON.stringify({ type: "Typing" , activeId , session }))
        }
    },[msg])

    useEffect(() => {
     if (!activeId) return;

     const loadMessages = async () => {
       const res = await axios.get("/api/app/message",{
           params: {
               activeId
           }
       })
       console.log("called");

       const messages = res.data.messages;
       console.log(messages);
        dispatch(
           setMessages({
            conversationId: activeId,
            messages,
           })
        );
       }

      loadMessages();
    }, [activeId]);

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        try{
            if(!socketRef.current) return;
            setMsg(e.target.value)
            if(e.target.value.length === 0){
             socketRef.current.send(JSON.stringify({ type: "Typing-stop" , activeId , session}))
            } else if(e.target.value.length){
              console.log("user is typing...");
              socketRef.current.send(JSON.stringify({ type: "Typing" , activeId , session}))
              setTimeout(() => {
               if(socketRef.current){
                socketRef.current.send(JSON.stringify({ type:"Typing-stop" , activeId , session}));
               }
              }, 3000);
            }
        } catch(error) {
            console.log("error",error);
        }
    }

    const formatISTTime = (isoTime: Date) => {
      return new Date(isoTime).toLocaleString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata"
     });
   };

   const reciverId = lastMessage?.receiversId;
   console.log("re",reciverId);

   const seenUserIds = reciverId && reciverId.filter(
     id => lastMessage.deliveryStatus && lastMessage?.deliveryStatus[id] === "read"
   );

   const isSeen = seenUserIds && seenUserIds.length > 0;

   console.log("seenuser",seenUserIds)
  return (
    <div className={`w-full h-screen flex items-center justify-center ${mode === "light" ? "bg-white text-black" : "bg-black text-white"}`}>
        <div className="h-full lg:w-[60%] w-[95%] flex flex-col gap-1">
            <div className="p-2">
                <div className="">
                    {
                        otherUser && 
                        <div className="flex items-center w-full gap-2">
                            <div className="relative">
                              <Image 
                               src={otherUser.otherUser?.image ? otherUser.otherUser.image : ""}
                               alt='User'
                               height={35}
                               width={35}
                               className='rounded-full object-cover hover:cursor-pointer'
                               />
                               <div className="absolute bottom-0 right-0">
                                 {
                                    allOnlineUsers.includes(otherUser.otherUser?.uniqueUserId ? otherUser.otherUser.uniqueUserId : "") && <div className="h-4 w-4 rounded-full flex items-center justify-center animate-pulse bg-green-800">
                                    <div className={`h-2 w-2 rounded-full ${typing ? "animate-bounce" : "animate-pulse"} bg-green-300`}></div>
                                    </div>
                                 }
                               </div>
                             </div>
                             <div className="relative w-full">
                                <p className='hover:cursor-pointer mb-3'>{otherUser.otherUser?.fullName}</p>
                                {
                                    !allOnlineUsers.includes(otherUser?.otherUser?.uniqueUserId ? otherUser.otherUser.uniqueUserId : "") ?
                                    <small className='text-xs absolute top-5 w-full text-gray-500'>{formatLastActive(otherUser?.otherUser?.lastActive ? otherUser.otherUser.lastActive : "")}</small>
                                    : <small className='text-xs absolute top-5 w-full text-gray-500'>Online</small>
                                }
                             </div>
                        </div>
                    }
                </div>
            </div>
            <div 
              className="w-full h-[80%] overflow-auto flex flex-col gap-2"
              ref={chatRef}
            >
                {
                    messages.length > 0 ? (
                        messages.map((msg: any, index) => {
                            const currentDate = formatMessageDateHeader(msg.createdAt);

                            const previous = 
                               index > 0 
                                 ? formatMessageDateHeader(messages[index-1].createdAt ? messages[index-1].createdAt : "") 
                                 : null

                            const showDateDivider = index === 0 || currentDate !== previous;

                        return (
                            <>
                            <div className="w-full text-center">
                                 {showDateDivider && (
                                   <div className="flex justify-center my-3">
                                     <span className="px-3 py-1 text-xs text-gray-500 bg-gray-200 rounded-full">
                                       {currentDate}
                                     </span>
                                   </div>
                                 )}
                            </div>
                            <motion.div
                             key={index}
                             className={`p-2 rounded flex flex-col relative lg:max-w-[50vw] md:max-w-[55vw] sm:max-w-[60vw] max-w-[95%] ${
                                 msg.senderId === session?.user.internalId
                                 ? "bg-blue-500 text-white ml-auto"
                                 : "bg-gray-200 text-black mr-auto"
                             }`}
                             >
                             <span className='max-w-[90%] flex-1 md:max-w-full break-words text-[4vw] sm:text-[2.2vw] md:text-[1.6vw] lg:text-[1.3vw] xl:text-[1vw]'>{msg.text}</span>
                             <div className="w-full text-end">
                                <p className='flex-1 ml-3 text-[3.2vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1vw] xl:text-[0.9vw]'>{formatISTTime(msg.createdAt)}</p>
                             </div>
                             </motion.div>
                             </>
                        )
                        })
                    ) : (
                        <div className="">
                            No Message!
                        </div>
                    )
                }
                {
                    isSeen && lastMessage.senderId === session?.user.internalId ? (
                        <div className="w-full text-end text-red-500">
                            Seen
                        </div>
                    ) : (
                       lastMessage?.senderId === session?.user.internalId && lastMessage?.status === "read" && (
                            <div className="w-full text-end">
                                Seen
                            </div>
                        )
                    )
                }
                {
                    typing && <Typing />
                }
            </div>
            <div className="flex items-center gap-5">
                <div className="flex-1">
                    <input 
                      type="text" 
                      value={msg}
                      onChange={handleTyping}
                      className={`px-3 py-3 w-full text-white rounded-lg border-none flex-1 outline-none shadow-[0_0_15px_4px_rgba(6,182,212,0.7),inset_0_0_10px_rgba(6,182,212,0.5)]`}
                      placeholder='Say, "Hi"'
                    />
                </div>
                <div className="">
                    <button
                    disabled={msg.length === 0}
                    className="hover:cursor-pointer text-xl disabled:pointer-event-none disabled:text-gray-700 bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
                        <i className="ri-send-plane-fill text-lg" onClick={handleSendMsg}></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
  )
}

export default page