"use client"
import React, {  useCallback, useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import 'remixicon/fonts/remixicon.css'
import { getSocket, subscribe , emit } from '@/lib/socket';
import { useSession } from 'next-auth/react';
import { addMessage, markMessagesRead, removeMessage, setMessages, updateMessage } from '@/redux/messageSlice';
import { seenLastMessage, setInfo, updateLastMessage } from '@/redux/conversationSlice';
import { Suspense } from "react";
import axios from 'axios';
import Image from 'next/image';
import Typing from './Typing';
import { AnimatePresence, motion, number } from 'motion/react';
import { setUserOnline } from '@/redux/themeSlice';
import { formatLastActive } from '@/lib/LastActive';
import { formatMessageDateHeader } from '@/lib/dateHeader';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';
import { subscribeToPush } from '@/lib/push';
import peer from '@/webrtc/peer';
import Call from '@/app/Components/Call';
import Delete from '@/app/Components/Delete';
import { Toaster } from 'react-hot-toast';
import { timeAgo } from '@/lib/timeAgo';

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
    const [speakerOn, setSpeakerOn] = useState(false);
    const params = useParams();
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const chatid = params.id as string;
    console.log("chat id",chatid);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [callState, setCallState] = useState<CallState>("idle");
    const [incomingOffer, setIncomingOffer] =useState<RTCSessionDescriptionInit | null>(null);
    const [callerId, setCallerId] = useState<string | null>(null);
    const [user , setUser] = useState<boolean>(false);
    const [remoteVideoOn, setRemoteVideoOn] = useState(false);
    const [cameraOn, setCameraOn] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [replyTo , setReplyTo] = useState<any>("");
    const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [deleteMsg , setDeleteMsg] = useState<any>("");
    const [edit , setEdit] = useState<any>("");

    const mode = useAppSelector((state) => state.theme.mode);
    const messages = useAppSelector((state) =>
        state.messages.byConversationId[activeId ? activeId : chatid]
     ) || [];
     const otherUser = useAppSelector((state) => state.conversations.byId[activeId ? activeId : chatid]);
     console.log("other uwer",otherUser);
     const allOnlineUsers = useAppSelector((state) => state.theme.users);
     const lastMessage = messages.at(-1);
     console.log("jhaevf",lastMessage);

     const conversations = useAppSelector(state =>
      state.conversations.allIds.map(
          id => state.conversations.byId[id]
      )
    );

    const seenTime = useAppSelector((state) => state.conversations.seenTime);

    console.log("cons",conversations);

    console.log("messages",messages);

    useEffect(() => {
        getSocket();
    
        const unsubscribe = subscribe(async(data: any) => {
            console.log("data on msg page",data);
            if(data.type === "MISSED_MESSAGES"){
                console.log("msg missed",data.msg);
            } else if(data.type === "edited") {
              console.log("data edit",data);
              dispatch(updateMessage({
                conversation: data.conversation,
                msgId: data.msgId,
                msg: data.msg
              }))
            } else if(data.type === "deleted") {
              setDeleteMsg("");
              console.log("deketeddd");
              toast.success("msg deleted!!");
            } else if(data.type === "reply-not-found") {
              toast.error("reply not found!!");
            }
             else if(data.type === "message received"){
                emit({ type: "seen" , activeId: activeId || chatid , session , msg: data.msg })
                console.log("in the page/room");
                console.log("msg", data);
                dispatch(addMessage({
                 _id: data.msg.clientMessageId,
                 conversationId: data.msg.conversationId,
                 senderId: data.msg.senderId,
                 text: data.msg.text,
                 createdAt: data.msg.createdAt,
                 status: "sent",
                 reply: {
                  clientId: data.reply?.clientId,
                  senderId: data.reply?.senderId,
                  text: data.reply?.text,
                  name: data.reply?.name
                }
                }));
                dispatch(updateLastMessage({
                  conversationId: data.msg.conversationId,
                  lastMessage: {
                      text: data.msg.text,
                      senderId: data.msg.senderId,
                      createdAt: data.msg.createdAt,
                      isRead: true
                  }
                }));
            } else if(data.type === "Typing") {
                setTyping(true);
                setTimeout(() => {
                    setTyping(false)
                },3000)
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
                let time = new Date();
                dispatch(setInfo(time));
                dispatch(markMessagesRead({ conversationId: data.msg.conversationId, userId: data.msg.senderId }))
                dispatch(seenLastMessage({ conversationId: activeId || chatid }));
                setTyping(false);
            } else if(data.type === "now-seen"){
                console.log("now seen just", data.unReadMsg);
                dispatch(markMessagesRead({ conversationId: activeId || chatid, userId: data.senderId }))
                dispatch(seenLastMessage({ conversationId: activeId || chatid }));
                setTyping(false);
            } else if(data.type === "unread-msg") {
                console.log("un read msg",data.unReadMsg);
                const lastMessage = data.unReadMsg.at(-1);
                emit({ type: "now seen" , activeId: activeId || chatid , senderId: data.senderId , lastMessage})
                if(data.unReadMsg.length > 0){
                    dispatch(setMessages({
                     conversationId: activeId ? activeId : chatid,
                     messages: data.unReadMsg,
                    }))
                }
            } else if(data.type === "seen-now") {
                console.log("seen just now");
               dispatch(markMessagesRead({ conversationId: data.activeId, userId: data.senderId }))
               dispatch(seenLastMessage({ conversationId: data.activeId }))
            } else if(data.type === "cannot-msg") {
                setNotFriend(true);
                console.log("user rejected the request");
            } else if(data.type === "cannot-msg-add") {
                setNotFriend(true);
                console.log("add first then u can msg");
                toast.error("Accept Request");
            } else if(data.type === "user-there") {
                try{
                    setUser(true);
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
                setCallState("connected");
                console.log("callState!!",callState);
                console.log("inco,mming,call,answer");
                await peer.setRemoteAnswer(data.answer);
            }
            else if (data.type === "call-ice") {
              peer.addIce(data.candidate);
            }
            else if (data.type === "call-end") {
              endCall();
              setCallerId("");
              setCall(false);
            } else if (data.type === "video-state") {
              setRemoteVideoOn(data.enabled);
            } else if(data.type === "delete-msg") {
              dispatch(removeMessage({ 
                conversation: data.del.conversationId,
                id: data.del._id || data.del.clientMessageId
              }))
            } else if(data.type === "error-edit") {
              // toast.error("error while editing!!");
              console.log("error");
            }
        }) 

        return () => unsubscribe()
    },[])

    const toggleCamera = () => {
        const next = !cameraOn;
         peer.toggleCamera(!cameraOn);
         setCameraOn(prev => !prev);
               emit({
           type: "video-state",
                  enabled: next,
           to: otherUser.otherUser?.uniqueUserId,
                   session
         })
       };

    const toggleMic = () => {
      peer.toggleMic(!micOn);
      setMicOn(prev => !prev);
    };

    const toggleSpeaker = () => {
      const next = !speakerOn;

      peer.toggleSpeaker(next);
      setSpeakerOn(prev => !prev);

      emit({
        type: "speaker-state",
        enabled: next,
        to: otherUser.otherUser?.uniqueUserId,
        session
      });
    };

    useEffect(() => {
        const fn = async() => {
            let subscription = await subscribeToPush(key ? key : "");
            emit({ type:"user-online", session , subscription });
        }

        fn();
    },[status])

    useEffect(() => {
        emit({ type:"user-online", session });
        emit({ type: "msg read" , activeId: activeId || chatid , session });
        emit({ type: "msg read online" , activeId: activeId || chatid , session });
    },[])

    console.log("reply to",replyTo);

    const handleSendMsg = () => {
        try{
            if(edit) {
              console.log("eddited", activeId || chatid , edit.clientMessageId || edit._id , msg);
              dispatch(updateMessage({ 
                conversation: activeId || chatid , 
                msgId: edit.clientMessageId || edit._id, 
                msg: msg 
              }))
              emit({ type: "edited" , edit , msg , activeId: activeId || chatid
                , msgId: edit.clientMessageId || edit._id, 
               });
              setEdit("");
              setMsg("");
            } else {
              setEdit("");
              const now = new Date();
            let clientId = crypto.randomUUID();
            const message = {
                clientMessageId: clientId,
                text: msg,
                activeId: activeId || chatid,
                type: "message sent",
                timeStamp: now.getTime(),
                senderId: session?.user.internalId,
                name: session?.user.name,
                reply: replyTo
            }

            if(activeId || chatid){
                dispatch(addMessage({
                 _id: clientId,
                 conversationId: activeId || chatid,
                 senderId: session?.user.internalId,
                 text: msg,
                 createdAt: Date.now(),
                 reply: {
                  clientId: replyTo?.clientMessageId,
                  senderId: replyTo?.senderId,
                  text: replyTo?.text,
                  name: replyTo?.senderId === session?.user.internalId ? session?.user.name : otherUser.otherUser?.fullName
                 }
                }));

                dispatch(updateLastMessage({
                    conversationId: activeId || chatid,
                    lastMessage: {
                        text: msg,
                        senderId: session?.user.internalId,
                        createdAt: Date.now(),
                    }
                }))
            }
            emit(message);
            setMsg("");
            setReplyTo("");
            emit({ type:"Typing-stop" , activeId: activeId || chatid , session})
            }
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
    //  if (!activeId || !chatid) return;

     const loadMessages = async () => {
       const res = await axios.get("/api/app/message",{
           params: {
               activeId: activeId || chatid
           }
       })
       console.log("called");

       const messages = res.data.messages;
       console.log("all msgsg",messages);
        dispatch(
           setMessages({
            conversationId: activeId || chatid,
            messages,
           })
        );
       }

      loadMessages();
    }, [activeId]);

    const startCall = async () => {
      setReplyTo("")
      setEdit("");
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
        otherUser,
        to: otherUser.otherUser?.uniqueUserId,
        candidate,
        session,
      });
    });

    peer.onRemoteStream(stream => {
      if (remoteVideoRef.current) {
        setRemoteStream(stream);
        remoteVideoRef.current.srcObject = stream;
        peer.setRemoteVideoElement(remoteVideoRef.current);
      }
    });

    const offer = await peer.createOffer();

    emit({
      type: "call-offer",
      otherUser,
      to: otherUser.otherUser?.uniqueUserId,
      offer,
      session,
      id: activeId || chatid
    });
  };

  const acceptCall = async () => {
    if (!incomingOffer || !callerId) return;

    setCallState("connected");

    peer.createPeer();

    const stream = await peer.getMedia();
    peer.addTracks();
    stream.getVideoTracks().forEach(t => (t.enabled = false));

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
        peer.setRemoteVideoElement(remoteVideoRef.current);
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
    if(!callerId) return;
    peer.close();
    setCallState("idle");
    setCameraOn(false);
    setSpeakerOn(false);
    setMicOn(true);
    setCall(false);
    setCallerId("");
    console.log("callerid",callerId , session?.user.internalId);

    if (callerId) {
     emit({ type: "call-end", to: callerId , session });
    } else {
      emit({ type:"call-end", to: otherUser.otherUser?.uniqueUserId , session });
      return;
    }
  }

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        try{
            setMsg(e.target.value)
            if(e.target.value.length === 0){
                emit({ type: "Typing-stop" , activeId: activeId || chatid , session})
            } else if(e.target.value.length){
              console.log("user is typing...");
                emit({ type: "Typing" , activeId: activeId || chatid , session})
              setTimeout(() => {
                emit({ type:"Typing-stop" , activeId: activeId || chatid , session})
              }, 4000);
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

   const handleClose = (val: boolean) => {
    setDeleteMsg("");
   }
  return (
    <div className={`w-full h-screen flex items-center justify-center ${mode === "light" ? "bg-white text-black" : "bg-black text-white"}`}>
        {
            call && <Call callState={callState} localVideo={localVideoRef} remoteVideo={remoteVideoRef} onAccept={acceptCall} onEndCall={endCall} other={otherUser}
            user={user} stream={stream} caller={callerId} session={session} remote={remoteVideoOn} speakerOn={speakerOn} toggleSpeaker={toggleSpeaker}
                        cameraOn={cameraOn} micOn={micOn} toggleCamera={toggleCamera} toggleMic={toggleMic} remoteStream={remoteStream}/>
        }
        <Toaster />
        <div className="h-full lg:w-[60%] w-[95%] flex flex-col gap-1">
            <div className="p-2">
                <div className="">
                    {
                        otherUser && 
                        <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex items-center w-full gap-2">
                                <div className="relative">
                              <Image 
                               src={
                                      otherUser.otherUser?.image
                                        ? otherUser.otherUser.image
                                        : ""
                                    }
                               alt='User'
                               height={40}
                               width={40}
                               className='rounded-full h-10 w-11 object-cover hover:cursor-pointer'
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
            {
              deleteMsg && <AnimatePresence>
                <Delete del={deleteMsg} close={() => setDeleteMsg("")} />
              </AnimatePresence>
            }
            <div 
              className="w-full h-[82%] overflow-auto flex flex-col gap-2"
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

                            const isMe = msg.senderId === session?.user.internalId;

                            const handleReplyClick = (id: string) => {
                                     const el = messageRefs.current[id];
                                     if (!el) {
                                       console.warn("Reply target not found:", id);
                                       return;
                                      }

                               el.scrollIntoView({
                                 behavior: "smooth",
                                 block: "center",
                               });

                               el.classList.add("ring-2", "ring-blue-400");
                               setTimeout(() => {
                                 el.classList.remove("ring-2", "ring-blue-400");
                               }, 1200);
                              };

                        return (
                            <>
                            <div className="w-full text-center"
                            ref={(el) => {
                               messageRefs.current[msg.clientMessageId] = el;
                            }}>
                                 {showDateDivider && (
                                   <div className="flex justify-center my-3">
                                     <span className="px-3 py-1 text-xs text-gray-500 bg-gray-200 rounded-full">
                                       {currentDate}
                                     </span>
                                   </div>
                                 )}
                            </div>
                            <div className="flex items-center gap-2">
                              <motion.div
                             drag="x"
                             dragSnapToOrigin
                             dragDirectionLock
                             dragElastic={0.2}
                             dragConstraints={{
                              left: isMe ? 0 : -80,
                              right: isMe ? 80 : 0
                             }}
                             onDragEnd={(e , info) => {
                              if(Math.abs(info.offset.x) > 40) {
                                setReplyTo(msg);
                              }
                              if(Math.abs(info.offset.x) > 80) {
                                setReplyTo("");
                                if(msg.senderId === session?.user.internalId) {
                                  setDeleteMsg(msg)
                                } else {
                                  setReplyTo(msg);
                                }
                              }
                              if(Math.abs(info.offset.x) > 160) {
                                setReplyTo("");
                                setDeleteMsg("");
                                const FIVE_MINUTES = 5 * 60 * 1000;
                                if(msg.senderId === session?.user.internalId) {
                                  let msgTime;
                                  if(msg.createdAt === number) {
                                    console.log("number",true);
                                    msgTime = msg.createdAt;
                                  } else {
                                    msgTime = new Date(msg.createdAt).getTime()
                                    console.log("msgf time", msgTime);
                                  }
                                  if(Date.now() - msgTime <= FIVE_MINUTES) {
                                    setEdit(msg);
                                    setMsg(msg.text)
                                  } else {
                                    toast.error("cannot edit msg now");
                                  }
                                } else {
                                  setReplyTo(msg);
                                }
                              }
                             }}
                             key={index}
                             className={`p-2 flex flex-col relative lg:max-w-[50vw] md:max-w-[55vw] sm:max-w-[60vw] max-w-[95%] ${
                                 msg.senderId === session?.user.internalId
                                 ?(
                                    ( edit._id === msg._id ) 
                                    ? "bg-red-500 rounded-xl rounded-br-none text-white ml-auto" 
                                    : "bg-blue-500 rounded-xl rounded-br-none text-white ml-auto"
                                  )
                                 : "bg-gray-200 rounded-xl rounded-bl-none text-black mr-auto"
                             }`}
                             >
                             <div className="">
                              {
                                msg.reply?.senderId && (
                                  <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                     handleReplyClick(msg.reply.clientId) 
                                    }}
                                   className={`mb-1 rounded border-l-4 p-1 text-sm
                                       ${isMe
                                         ? "bg-blue-400/40 border-blue-300"
                                         : "bg-gray-300 dark:bg-gray-500 border-green-500"
                                       }`}
                                   >
                                    <div className="font-bold">
                                      {
                                         msg.reply.senderId === session?.user.internalId ? "You" : otherUser?.otherUser?.fullName
                                      }
                                    </div>
                                    <div className="w-full break-words">{msg.reply.text}</div>
                                 </div>
                                )
                              }
                              <div
                              className='max-w-xs relative break-words flex-1 md:max-w-full text-[4vw] sm:text-[2.2vw] md:text-[1.6vw] lg:text-[1.3vw] xl:text-[1vw]'>{msg.text}</div>
                              {
                                msg.edited && 
                                <div className="">
                                  <small>(edited)</small>
                                </div>
                              }
                              <div className="w-full text-end">
                                <p className='flex-1 ml-3 text-[3.2vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1vw] xl:text-[0.9vw]'>{formatISTTime(msg.createdAt)}</p>
                              </div>
                             </div>
                              </motion.div>
                              {
                                msg.senderId === session?.user.internalId && msg.status === "sent" && 
                                <div className="">
                                  <i className="ri-send-plane-2-line"></i>
                                </div>
                              }
                            </div>
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
                        <div className="w-full transition-all duration-150 ease-in flex justify-end gap-1.5 text-gray-300">
                            <small>Seen</small>
                            <small>{timeAgo(seenTime)}</small>
                        </div>
                    ) : (
                       lastMessage?.senderId === session?.user.internalId && lastMessage?.status === "read" && (
                            <div className="w-full flex transition-all duration-150 ease-in justify-end items-center gap-1.5">
                                <small>Seen</small>
                                <small>{timeAgo(seenTime)}</small>
                            </div>
                        )
                    )
                }
                {
                    typing && <Typing />
                }
            </div>
            <div className="flex items-center gap-5">
                <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={msg}
                      onChange={handleTyping}
                      className={`px-3 py-3 w-full text-white rounded-lg border-none flex-1 outline-none shadow-[0_0_15px_4px_rgba(6,182,212,0.7),inset_0_0_10px_rgba(6,182,212,0.5)]`}
                      placeholder='Say, "Hi"'
                    />
                    <div className={`absolute left-0 bottom-full rounded-md bg-black transition-all z-99 duration-400 ease-in p-2
                      ${edit ? "translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                        <div className="border-cyan-500" onClick={() => {
                          setEdit("")
                          setMsg("")
                          }}>
                          <i className="ri-close-fill"></i>
                        </div>
                    </div>
                    <div className={`absolute left-0 bottom-full border-cyan-500 rounded-md bg-black border-1 border-b-none transition-all z-99 duration-400 ease-in w-full p-2
                      ${replyTo ? "translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                        <div className="flex flex-col after:content-[''] after:absolute after:-left-1 after:top-0 after:h-full after:w-2 after:rounded-md after:bg-cyan-800">
                          <div className="w-full flex items-center justify-between">
                            <div className="text-bold">
                              {otherUser?.otherUser?.fullName}
                            </div>
                            <div className="" onClick={() => setReplyTo("")}>
                              <i className="ri-close-fill"></i>
                            </div>
                          </div>
                          <div className="w-full max-h-[40vh] text-gray-300 break-words">
                            {replyTo.text}
                          </div>
                        </div>
                    </div>
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
