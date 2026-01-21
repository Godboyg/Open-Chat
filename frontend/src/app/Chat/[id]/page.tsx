"use client"
import React, {  useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import 'remixicon/fonts/remixicon.css'
import { getSocket, subscribe , emit } from '@/lib/socket';
import { useSession } from 'next-auth/react';
import { addMessage, markMessagesRead, setMessages } from '@/redux/messageSlice';
import { updateLastMessage } from '@/redux/conversationSlice';
import { Suspense } from "react";
import axios from 'axios';
import Image from 'next/image';
import Typing from './Typing';
import { motion } from 'motion/react';
import { setUserOnline } from '@/redux/themeSlice';
import { formatLastActive } from '@/lib/LastActive';
import { formatMessageDateHeader } from '@/lib/dateHeader';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';
import { subscribeToPush } from '@/lib/push';
import peer from '@/webrtc/peer';
import { getServerSession } from 'next-auth';
import Call from '@/app/Components/Call';

const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
type CallState = "idle" | "calling" | "ringing" | "connected";

function Page() {

    const chatRef = useRef<HTMLDivElement | null>(null);
    const [msg , setMsg] = useState<string>("");
    const activeId = useAppSelector((state) => state.conversations.activeId);
    console.log("activeid",activeId);
    const dispatch = useAppDispatch();
    const { data: session , status } = useSession();
    const [typing , setTyping] = useState<boolean>(false);
    const [notFriend , setNotFriend] = useState<boolean>(false);
    const [call , setCall] = useState<boolean>(false);
    const params = useParams();
    const [stream, setStream] = useState<MediaStream | null>(null);
    const chatid = params.id as string;
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [callState, setCallState] = useState<CallState>("idle");
    const [incomingOffer, setIncomingOffer] =useState<RTCSessionDescriptionInit | null>(null);
    const [callerId, setCallerId] = useState<string | null>(null);
    const [user , setUser] = useState<boolean>(false);

    const mode = useAppSelector((state) => state.theme.mode);
    const messages = useAppSelector((state) =>
        state.messages.byConversationId[activeId ? activeId : chatid]
     ) || [];
     const otherUser = useAppSelector((state) => state.conversations.byId[activeId ? activeId : chatid]);
     console.log("other uwer",otherUser);
     const allOnlineUsers = useAppSelector((state) => state.theme.users);
     const lastMessage = messages.at(-1);
     console.log("jhaevf",lastMessage);

    console.log("messages",messages);

    useEffect(() => {
        getSocket();
    
        const unsubscribe = subscribe(async(data: any) => {
            console.log("data on msg page",data);
            if(data.type === "MISSED_MESSAGES"){
                console.log("msg missed",data.msg);
            } else if(data.type === "message received"){
                emit({ type: "seen" , activeId , session , msg: data.msg })
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
                setTimeout(() => {
                    setTyping(false)
                },2000)
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
                setTyping(false)
            } else if(data.type === "now-seen"){
                console.log("now seen just", data.unReadMsg)
                dispatch(markMessagesRead({ conversationId: activeId, userId: data.senderId }))
                setTyping(false)
            } else if(data.type === "unread-msg") {
                console.log("un read msg",data.unReadMsg);
                emit({ type: "now seen" , activeId , senderId: data.senderId})
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
            } else if(data.type === "user-there") {
                try{
                    setUser(true)
                } catch(error) {
                    console.log("error",error)
                }
            } else if (data.type === "call-offer") {
                console.log("inco,mming,call",data.from);
                setCall(true);
                // alert("incomming call,");
                setCallerId(data.from!);
                setIncomingOffer(data.offer);
                setCallState("ringing");
            } else if (data.type === "call-answer") {
                console.log("inco,mming,call,answer");
                await peer.setRemoteAnswer(data.answer);
                setCallState("connected");
            }
            else if (data.type === "call-ice") {
              peer.addIce(data.candidate);
            }
            else if (data.type === "call-end") {
              endCall();
              setCallerId("");
              setCall(false);
            }
        }) 

        return () => unsubscribe()
    },[])

    useEffect(() => {
        const fn = async() => {
            let subscription = await subscribeToPush(key ? key : "");
            emit({ type:"user-online", session , subscription });
        }

        fn();
    },[status])

    useEffect(() => {
        emit({ type: "msg read" , activeId , session });
    },[messages])

    useEffect(() => {
        emit({ type:"user-online", session });
        emit({ type: "msg read" , activeId , session });
        emit({ type: "msg read online" , activeId , session });
    },[status])

    const handleSendMsg = () => {
        try{
            const now = new Date();
            const message = {
                clientMessageId: crypto.randomUUID(),
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
            emit(message);
            setMsg("");
            emit({ type:"Typing-stop" , activeId , session})
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
        emit({ type: "Typing" , activeId , session });
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

    const startCall = async () => {
    setCallState("calling");
    setCall(true);
    setCallerId(session?.user.internalId ? session.user.internalId : "");

    peer.createPeer();

    const stream = await peer.getMedia();
    peer.addTracks();
    stream.getVideoTracks().forEach(t => (t.enabled = false));

    setStream(stream);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    peer.onIce(candidate => {
      emit({
        type: "call-ice",
        to: otherUser.otherUser?.uniqueUserId,
        candidate,
        session
      });
    });

    peer.onRemoteStream(stream => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    const offer = await peer.createOffer();

    emit({
      type: "call-offer",
      to: otherUser.otherUser?.uniqueUserId,
      offer,
      session
    });
  };

  const acceptCall = async () => {
    if (!incomingOffer || !callerId) return;

    setCallState("connected");

    peer.createPeer();

    const stream = await peer.getMedia();
    peer.addTracks();

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    peer.onIce(candidate => {
      emit({
        type: "call-ice",
        to: callerId,
        candidate,
        session
      });
    });

    peer.onRemoteStream(stream => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    const answer = await peer.createAnswer(incomingOffer);

    emit({
      type: "call-answer",
      to: callerId,
      answer,
      session
    });
  };


  const endCall = () => {
    peer.close();
    setCallState("idle");
    setCall(false);
    setCallerId("");

    if (callerId) {
      emit({ type: "call-end", to: callerId , session });
    }
  };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        try{
            setMsg(e.target.value)
            if(e.target.value.length === 0){
                emit({ type: "Typing-stop" , activeId , session})
            } else if(e.target.value.length){
              console.log("user is typing...");
                emit({ type: "Typing" , activeId , session})
              setTimeout(() => {
                emit({ type:"Typing-stop" , activeId , session})
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
        {
            call && <Call callState={callState} localVideo={localVideoRef} remoteVideo={remoteVideoRef} onAccept={acceptCall} onEndCall={endCall} other={otherUser}
            user={user} stream={stream} caller={callerId} session={session}/>
        }
        <div className="h-full lg:w-[60%] w-[95%] flex flex-col gap-1">
            <div className="p-2">
                <div className="">
                    {
                        otherUser && 
                        <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex items-center w-full gap-2">
                                <div className="relative">
                              <Image 
                               src={otherUser.otherUser?.image ? otherUser.otherUser.image : ""}
                               alt='User'
                               height={40}
                               width={40}
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
                            <div className="hover:cursor-pointer">
                                <button onClick={startCall}>📞</button>
                            </div>
                        </div>
                    }
                </div>
            </div>
            <div 
              className="w-full h-[80%] overflow-auto flex flex-col gap-2"
              ref={chatRef}
            >
                <Suspense fallback={<p>Loading.....</p>}>
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
                </Suspense>
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

export default Page