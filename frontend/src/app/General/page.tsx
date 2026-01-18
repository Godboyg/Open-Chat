"use client"
import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import { useAppDispatch , useAppSelector } from '@/redux/hooks';
import Dots from '../Components/Dots';
import { motion , AnimatePresence } from 'motion/react';
import { signOut } from 'next-auth/react';
import { getSocket , subscribe , emit } from '@/lib/socket';
import { getCurrentTime } from './CurrentTime';
import { useSession } from 'next-auth/react';
import { Suspense } from "react";
// import dynamic from 'next/dynamic'
// import data from '@emoji-mart/data'
import Image from 'next/image';
import 'remixicon/fonts/remixicon.css'
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { setOnlineCount, setUserOnline } from '@/redux/themeSlice';
// const Picker = dynamic(() => import('@emoji-mart/react'), { ssr: false })
import axios from 'axios';
import Notification from '../Components/Notification';
import { addFriend, addFriendRequest, Friend, removeFriend, removeFriendRequest } from '@/redux/friendSlice';
import { setActiveConversation, setConversations, updateLastMessage, upsertConversation } from '@/redux/conversationSlice';
import { addNotification } from '@/redux/notificationSlice';
import { addMessage } from '@/redux/messageSlice';
import { formatLastActive } from '@/lib/LastActive';

type User = {
    name: string | null | undefined,
    image: string | null | undefined
}

type message = {
    type: string,
    msg: string | undefined | null,
    text?: string,
    time: string,
    user?: number,
    User?: User,
    User_id?: string,
    current?: User,
    size?: string,
    timestamp?: number,
    reply?: (message | null | undefined)[] | null,
    avtr?: string,
}

type activeUsers = {
    isActive: boolean,
    current: {
        name: string | null | undefined,
        email: string | null | undefined,
        image: string | null | undefined,
    }
}

export type NotificationType = {
    from?: string,
    to?: string,
    notificationReceived?: {
        createdAt?: string
        from?: string
        isRead?: false
        message?: string
        type?: string
        userId?: string
        _id?: string
    },
    found: {
        image?: string
        name?: string
        fullName?: string
        lastActive?: string
    }
}

function Page() {
    const [open , setOpen] = useState(false);
    const [notify , setNotify] = useState<NotificationType[]>([]);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [thought , setThought] = useState<string | null | undefined>("");
    const [screenSize , setScreenSize] = useState(true);
    // const [allUsers, setAllUsers] = useState<number>()
    const [typer , setTypers] = useState<string[]>([]);
    const bottomRef = useRef<HTMLDivElement | null>(null)
    const [loading , setLoading] = useState<boolean>(false)
    const contRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [avtr , setAvtr] = useState<string>("");
    const [ans , setAns] = useState<"reply" | "edit" | "">("");
    const clickTimeout = useRef<NodeJS.Timeout | null>(null);
    const [isTrue , setIsTrue] = useState(false);
    const [pMsg , setPMsg] = useState<any[]>([]);
    const [conve , setConvo] = useState<string>("");
    const [messages , setMessages] = useState<message[]>([]
    //     () => {
    //   const saved = localStorage.getItem("msg");
    //   return saved ? JSON.parse(saved) : [];
    // } 
    )
    console.log("messagesss",messages);
    const [formdata , setFormData] = useState({
      fullName: "",
      phoneNumber: ""
    })
    const [currentUser , setCurrentUser] = useState<User>({
        name: "", 
        image: ""
    })
    const [replyTo, setReplyTo] = useState<message | null>(null);
    const [editTo , setEditTo] = useState<message | null>(null);

    const [dclik , setDClick] = useState(false);
    // const [active , setActive] = useState(false);
    const [typing , setTyping] = useState<boolean>(false); 
    const profileRef = useRef<HTMLDivElement | null>(null);
    // const [activeUsers , setActiveUsers] = useState<activeUsers[]>([])
    // const [allActiveUsers , setAllActiveUsers] = useState<string[]>([]);
    const [disabled, setDisabled] = useState<boolean>(false);
    const [viewProfile , setViewProfile] = useState<boolean>(false)
    const [stage , setStage] = useState<"add" | "done" | "processing">("add");
    const [show, setShow] = useState<boolean>(false);
    const router = useRouter();
    const { data: session , status} = useSession();
    const [currentProfile , setCurrentProfile] = useState<message | null >(null)

    useEffect(() => {
        if(status === "authenticated"){
            console.log("authenticated", session);
        }
        else if(status === "unauthenticated"){
            router.push("/");
        } else {
            console.log("loading...");
        }
    },[status])

    useEffect(() => {
        const currentUser = async() => {
            const res = await axios.get("/api/app/user/current", {
                params: {
                    uniqueUserId: session?.user.internalId
                }
            })

            console.log("response !!!!!!!",res.data);

            const user = res.data.current;

            if(user && !user.fullName && !user.phoneNumber){
                setIsTrue(true);
                setFormData({
                 fullName: "",
                 phoneNumber: ""
                })
            } else{
                setIsTrue(false);
            }
        }

        currentUser();

        dispatch(setActiveConversation(null));
    },[session, status])

    useEffect(() => {
        const handleMouseDown = (e: Event) => {
            const target = e.target as HTMLDivElement;
            if(profileRef.current && !profileRef.current.contains(target)){
                setViewProfile(false);
            }
        }

        document.addEventListener("mousedown", handleMouseDown);

        return () => document.removeEventListener("mousedown", handleMouseDown);
    },[])

    const avtars = [
        "https://images.pexels.com/photos/33696522/pexels-photo-33696522.jpeg",
        "https://images.pexels.com/photos/34295250/pexels-photo-34295250.jpeg",
        "https://images.pexels.com/photos/33927026/pexels-photo-33927026.jpeg",
        "https://images.pexels.com/photos/33428346/pexels-photo-33428346.jpeg",
        "https://images.pexels.com/photos/34136522/pexels-photo-34136522.jpeg",
        "https://images.pexels.com/photos/33299899/pexels-photo-33299899.jpeg",
        "https://images.pexels.com/photos/34106121/pexels-photo-34106121.jpeg",
        "https://images.pexels.com/photos/34038191/pexels-photo-34038191.jpeg",
        "https://images.pexels.com/photos/33342180/pexels-photo-33342180.jpeg",
        "https://images.pexels.com/photos/34170816/pexels-photo-34170816.jpeg",
        "https://images.pexels.com/photos/34123169/pexels-photo-34123169.jpeg",
        "https://images.pexels.com/photos/34295619/pexels-photo-34295619.jpeg"   
    ]

    useEffect(() => {
        const rand = Math.floor(Math.random() * 10) + 1;
        if(!session || !session.user?.image){
            setAvtr(avtars[rand]);
        }
    },[session])

    const Text = "No Message".split(" ");

    const handleScroll = () => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });
    };

    useEffect(() => {
       const container = contRef.current;
       if (!container) return;

       const checkOverflow = () => {
         setShowScrollButton(container.scrollHeight > container.clientHeight);
       };

       checkOverflow();

       window.addEventListener("resize", checkOverflow);

       return () => window.removeEventListener("resize", checkOverflow);
     }, [messages]);

    useEffect(() => {
        console.log("data session",session);
        setCurrentUser({
            name: session?.user?.name,
            image: session?.user?.image
        });
    },[session])

    const dispatch = useAppDispatch();

    const { mode , onlineCount } = useAppSelector((state) => state.theme);

    // console.log("online count",onlineCount);
    const friend = useAppSelector((state) => state.friends.friends);
    const items = useAppSelector((state) => state.notifications.items);
    console.log(items);
    console.log("friend",friend);
    const allOnlineUsers = useAppSelector((state) => state.theme.users);
    console.log("allonlie",allOnlineUsers);
    const conversations = useAppSelector(state =>
      state.conversations.allIds.map(
        id => state.conversations.byId[id]
     )
    );

    const hasMessage = conversations.some(
      convo => convo.message && convo?.message > 0
    );
    console.log("111",conversations);

    useEffect(() => {
        const handleDown = (e: MouseEvent) => {
            const target = e.target as HTMLDivElement
            if(containerRef.current && !containerRef.current.contains(target)){
                setOpen(false);
                setPMsg([]);
                emit({ type: "mark-d" , session });
            }
        }

        document.addEventListener("mousedown",handleDown);
    },[])

    useEffect(() => {
        getSocket()
        
        const unsubscribe = subscribe((data) => {
            console.log("data on message",data);
            if(data.isActive){
                console.log("datasda",data);
                // setActiveUsers((prev) => {
                //     const exists = prev.some((user) => user?.current?.name === currentUser?.name)
                //     if(exists) return prev;
                //     return [...prev , data];
                // })
            }
            else if(data.type === "thought"){
                setMessages((prev) => [...prev, data]);
            } else if(data.type === "all-msg") {
                setMessages(data.messages);
            } else if(data.type === "toEdit"){
                setMessages((prevMessages) => {
                   return prevMessages.map((prev) => {
                        return prev.text === data.msg.text ? { ...prev , text: data.newMsg } : prev
                    })
                })
            } else if(data.type === "chat_history") {
                console.log("dataa",data.parsedMessages);
                setMessages(data.parsedMessages);
                console.log("messgg",messages);
            }
            else if(data.type === "onlineUsers"){
                console.log("onlineuser",data);
                // setAllUsers(data.size);
                localStorage.setItem("onlineUsers",data.size);
                dispatch(setOnlineCount(data.size));
            }
            else if(data.type === "ONLINE_USERS"){
                // setAllActiveUsers(data.users);
                dispatch(setUserOnline(data.users));
                console.log("online users []",data.users);
            } else if(data.type === "ONLINE_USERS_AFTER"){
                dispatch(setUserOnline(data.users));
                console.log("data.payload.after",data.users);
            } else if(data.type === "friend_request_received") {
                dispatch(addFriendRequest({
                    _id: data.payload.from,
                    to: data.payload.to,
                    name: data.payload.found.fullName,
                    image: data.payload.found.image,
                    status: "pending"
                }))
                console.log("request from", data.payload);
                setNotify((prev) => {
                    const isthere = prev.some(n => n.from === data.payload.from) 
                    if(isthere) {
                      return prev
                    }else {
                      return [...prev , data.payload] 
                    }
                 });
                // setNotify((prev) => [...prev, data.payload]);
                // socketRef.current?.send(JSON.stringify({ type: "friend-request-rejected" , from: data.payload.from , to: data.payload.notificationReceived }))
                setShow(true);
                // setTimeout(() => {
                //     setShow(false);
                // },14000)
            } else if (data.type === "PENDING_NOTIFICATIONS") {
                console.log("PENDING_NOTIFICATIONS",data.data);
                const formattedNotification = data.data.length > 0 ? data.data.map((n: { from: string; type: string; message: string; to: string; isRead: boolean; userId: string; }) => ({
                    _id: n.userId,
                    to: n.from || n.to,
                    type: n.type,
                    message: n.message,
                    read: n.isRead
                })) : [];

                if(formattedNotification.length > 0) {
                    dispatch(addNotification(formattedNotification));
                }

                for(const d of data.data){
                    if(d.message === "unfriend by the user") {
                        dispatch(removeFriend({
                         _id: d.to,
                        }));
                        dispatch(addFriendRequest({
                         _id: d.userId,
                         to: d.to,
                         status: "pending"
                       }))   
                       emit({ type: "done" , session });
                    }
                    if(d.message === "friend by the user") {
                        dispatch(addFriend({
                          _id: data.to,
                          status: data.status,
                          conversationId: data.conversationId
                        }));
                        // const upsert = {
                        //   convo : {
                        //   _id: data.conversationId,
                        //   participents: [data.to , data.userId]
                        //   }
                        // }
                        // dispatch(upsertConversation(upsert));
                       dispatch(removeFriendRequest({ to: data.to , from: data.userId }))
                       emit({ type: "done" , session });
                    }
                    if(d.conversationId){
                    // if(d.message === "request-accepted" || d.message === "REQUEST_RECEIVED" || d.message === "REQUEST_SENT"){
                        const upsert = {
                            convo : {
                                 _id: d.conversationId,
                                  participants: [d.userId , d.from]
                            }
                        }
                        dispatch(upsertConversation(upsert));
                    }
                }
            } else if (data.type === "request-accepted"){
                dispatch(addFriend({
                    _id: data._id,
                    status: data.status,
                    conversationId: data.conversationId
                }));
                const upsert = {
                    convo : {
                        _id: data.conversationId,
                        participents: [data._id , data.from]
                    }
                }
                dispatch(upsertConversation(upsert));
                dispatch(removeFriendRequest({ to: data._id , from: data.to }))
                console.log("Friend request accepted", data.newFriend);
            } else if(data.type === "PENDING_MSG"){
                console.log("pending msg",data.message)
                setPMsg(data.message);
                dispatch(addMessage({
                   conversationId: data.message.conversationId,
                   senderId: session?.user.internalId,
                   text: data.message.text
                }))
            } else if(data.type === "message received"){
               console.log("new message", data.msg);
               setPMsg((prev) => [...prev, data.msg]);
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
                setConvo(data.convo);
            } else if(data.type === "Typing-stop") {
                setTyping(false);
            } else if(data.type === "Typing-g") {
                setTyping(true);
                setTypers((prev) => prev.includes(data.session.user.image) ? prev : [...prev , data.session.user.image]);
            } else if(data.type === "Typing-stop-g") {
                setTyping(false);
                setTypers((prev) => 
                    prev.filter(user => user !== data.session.user.image)
                )
            } else if(data.type === "user-unfrnd") {
                 dispatch(removeFriend({
                    _id: data.to,
                }));
                dispatch(addFriendRequest({
                    _id: data.sender,
                    to: data.to,
                    status: "pending"
                }))
                console.log("u were frnd by the user", data.newFriend)
            } else if(data.type === "unfrnd") {
                dispatch(removeFriend({
                    _id: data.sender,
                }));
                dispatch(addFriendRequest({
                    _id: data.sender,
                    to: data.to,
                    status: "pending"
                }))
                console.log("u were frnd by the user", data.newFriend)
            } else if(data.type === "request-sent") {
                console.log("request",data.senderNotification , data.to , data.from);
                dispatch(addFriendRequest({
                    _id: data.from,
                    to: data.to,
                    status: "pending"
                  }))
            }
        })

        return () => unsubscribe()
    },[])

     const matchedFriend = friend.find(
          (fnd: Friend) => fnd._id === currentProfile?.User_id
     );

    useEffect(() => {
        const store = async() => {
            const res = await axios.get("/api/app/user/friendship", {
                params: {
                    userId: session?.user.internalId
                }
            });

            const friends = res.data.friendShip
            console.log("frienshs",friends);

            if(res.data) {
                friends.forEach((f: any) => 
                    f.requester === session?.user.internalId
                    ? dispatch(addFriend({
                    _id: f.recipient,
                    status: f.status,
                    conversationId: f.conversationId
                     }))
                    : dispatch(addFriend({
                    _id: f.requester,
                    status: f.status,
                    conversationId: f.conversationId
                    }))
                )
            }

            console.log("result",res.data);
        }

        store();
    },[status])

    useEffect(() => {
        const cleaner = setInterval(() => {
            const msg = { time: Date.now() };
            setMessages((prev) => 
                prev.filter(ms => ms.timestamp ? msg.time - ms.timestamp < 300000: "")
            )
        },7000)

        return () => clearInterval(cleaner)
    },[session])

    useEffect(() => {
        localStorage.setItem("msg", JSON.stringify(messages));
    },[messages])

    useEffect(() => {
        if(window.innerWidth >= 640) {
            setScreenSize(false);
        } else {
            setScreenSize(true);
        }

        const handleReSize = (e: UIEvent) => {
            if(window.innerWidth <= 640){
                setScreenSize(true);
            } 
        }

        window.addEventListener("resize",handleReSize);
    },[screenSize , window.innerWidth])

    useEffect(() => {
        const allConvo = async() => {
            try{
                const res = await axios.get("/api/app/conversation",{
                    params: {
                        userId: session?.user.internalId
                    }
                })

                dispatch(setConversations(res.data.data));

                console.log("all convo", res.data.data);
                // console.log("all convo message", res.data.message);
                // console.log("all con!!!!!!", res.data.user);
            } catch(error) {
               console.log("error",error);
            }
        } 

        allConvo();
    },[status , open])

    const handleSendMsg = () => {
        try{
            if (!thought?.trim()) return;
            const now = new Date();
            const timestamp = now.getTime();
            setThought("");
            const currentTime = getCurrentTime();
            const newMsg: message = { 
                type: "thought" , 
                msg: thought, 
                time: currentTime , 
                User: currentUser, 
                User_id : session?.user.internalId,
                avtr: avtr,
                timestamp: timestamp , 
                reply: replyTo ? [replyTo] : null
            }
            console.log("msg", newMsg)
            emit(newMsg);
            // setMessages((prev) => [...prev , newMsg]);
            setReplyTo(null);
            console.log("messagesss",messages);
            emit({ type:"Typing-stop" ,session});
        } catch(error){
            console.log(error);
        }
    }

    const handleReplyClick = (messageObj: any) => {
      try{
        console.log("msg",messageObj);
         clickTimeout.current = setTimeout(() => {
            setAns("reply")
            if(ans === "reply"){
                setReplyTo(messageObj);
            }
         },150)
         contRef.current?.scrollIntoView({ behavior: "smooth" });
      } catch(err) {
        console.log("err",err);
      } 
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const { name , value } = e.target;
    
      setFormData((prev) => ({
        ...prev,
        [name] : value,
      }))
    }

     const handleSend = async() => {
        try{
            setStage("processing");
            const res = await axios.patch("/api/app/user/update",{
                uniqueUserId: session?.user.internalId,
                fullName: formdata.fullName,
                phoneNumber: formdata.phoneNumber
            },{
                timeout: 5000
            })

            if(res.data.Message === "Done!"){
                setStage("done");
                setIsTrue(false);
                window.location.reload();
            }

            console.log("response!!!", res.data);
        } catch(error) {
            setStage("add");
            alert(error);
            console.log("error",error);
        }
     }

    const handleDoubleClick = (msg: message) => {
        try{
            if (clickTimeout.current) clearTimeout(clickTimeout.current);
            if(msg.current?.name === currentUser.name) {
                setAns("edit");
                setDClick(true);
                setThought(msg.text);
                setReplyTo(null);
                console.log("message to be edited", msg);
                setEditTo(msg);
            }
        } catch (err) {
            console.log("error",err);
        }
    }

    const handleEdit = () => {
        try{
            if(editTo){
                emit({ type: "toEdit" , msg: editTo , newMsg: thought });
             setMessages((prevMessage: any) => {
                return prevMessage.map((prev: any) => {
                    return prev.text === editTo.text ? { ...prev , text: thought } : prev
                })
             })   
             console.log("after edit",messages);
             setDClick(false);
             setEditTo(null);
             setThought("");
             setAns("");
            }
        } catch(err) {
            console.log(err);
        }
    }

    const handleSendRequest = () => {
        try{
            setDisabled(true);
            console.log("Request send");
            emit({ type:"friend-request" , from: session?.user.internalId , to: currentProfile?.User_id});
        } catch(error) {
            console.log("Error",error);
        }
    }

    const handleOnIs = (e: boolean) => {
        console.log("baiaa",e);
        setShow(false)
    }

    const handleClose = (data: boolean) => {
        setShow(data);
    }

    const handleFriendRequestAccept = (val: Friend) => {
        try{
            // alert(val);
            console.log("data after accept",val)
            emit({ type: "friend-request-accepted" , from: val._id , to: val.to });
        } catch(error) {
            console.log("error",error)
        }
    }

    const handleMsgClick = () => {
        try{
            console.log("clickeddd");
            setOpen(true);
            setPMsg([]);
            emit({ type: "mark-d" , session });
        } catch(error) {
            console.log("error",error);
        }
    }

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        try{
            setThought(e.target.value);
            if(e.target.value.length === 0){
                emit({ type: "Typing-stop-g" , session})
            } else if(e.target.value.length){
              console.log("user is typing...");
                emit({ type: "Typing-g" , session})
              setTimeout(() => {
                emit({ type:"Typing-stop-g" , session})
              }, 3000);
            }
        } catch(error) {
            console.log("error",error);
        }
    }
 
  return (
    <div className={`h-screen relative w-full ${mode ? "bg-black text-white" : "bg-white text-black"}`}>
        <Toaster />
        <div className="w-full flex items-center justify-center">
            {
                show && (
                    <Suspense fallback={<p>Loading..</p>}>
                        <Notification isOn={show} onIs={handleOnIs} notification={notify} close={handleClose} accepted={handleFriendRequestAccept}/>
                    </Suspense>
                )
            }
        </div>
        <div className="py-3 px-3.5 flex items-center w-full">
            <div className="p-4 md:py-3 md:px-4 hover:cursor-pointer rounded-tl-md rounded-bl-md [clip-path:polygon(0_0,100%_0,100%_100%,20%_100%,0_60%)] rounded-tr-md
             bg-black shadow-[0_0_15px_5px_rgba(6,182,212,0.7),inset_0_0_10px_rgba(6,182,212,0.5)]"
            onClick={handleMsgClick}>
                {
                    pMsg.length > 0 ? (
                        <div className="relative">
                                 <i className="ri-chat-1-line text-shadow-md"></i>
                                 <div className="absolute -top-2 flex
                                  items-center justify-center rounded-full h-4.5 w-4.5 -right-3">
                                    <span className='lg:text-[1vw] sm:text-[1.5vw] text-[2.5vw] text-red-400'>{pMsg.length}</span>
                                 </div>
                        </div>
                    ) : (
                        conversations.length > 0 && (
                         hasMessage ? (
                          <div className="relative">
                            <i className="ri-send-plane-line"></i>
                            <div className="h-1.5 w-1.5 rounded-full bg-red-500 absolute bottom-0 right-0"></div>
                            </div>
                          ) : (
                           <Dots theme={mode} />
                          )
                         )
                    )
                }
            </div>
            <div className="absolute lg:top-[50%] top-[3%] right-[3%] lg:left-7 hover:bg-gray-800 transition duration-300 ease-in h-9 w-9 flex items-center justify-center rounded-full hover:cursor-pointer text-white"
            onClick={() => {
                router.push("/Notifications")
            }}>
                <i className="ri-notification-line"></i>
                {
                    items.length > 0 && items.map((itm , index) => (
                        itm.read !== true && (
                            <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500"
                            key={index}>
                              <div className="w-full h-full flex items-center justify-center text-sm">
                               {items.length}                        
                              </div>
                            </div>
                        )
                    ))
                }
            </div>
        </div>
        <div className="w-full flex items-center justify-center">
            <div className="w-[95%] lg:w-[60%] px-2 relative h-[90vh]">
                <div className="absolute w-full px-2 md:px-5 py-2 gap-2 md:gap-4 flex items-center justify-between bottom-0 left-0">
                    <div className="bg-black rounded-lg w-full h-full">
                        <input 
                         type="text"
                         value={thought ?? ""}
                         onChange={handleTyping}
                         placeholder='Write your mind...'
                         className={`px-3 py-4 w-full text-white rounded-lg border-none outline-none shadow-[0_0_15px_4px_rgba(6,182,212,0.7),inset_0_0_10px_rgba(6,182,212,0.5)]`}
                        />
                    </div>
                    <div className="">
                        {/* <Picker
                          data={data}
                          onEmojiSelect={(emoji: any) => console.log(emoji.native)}
                          theme="light"
                        /> */}
                    </div>
                    <div className="">
                        <button
                        disabled={thought?.length === 0}
                        className='text-xl disabled:text-gray-700 disabled:pointer-events-none font-bold hover:cursor-pointer text-transparent bg-clip-text bg-gradient-to-b
                        from-green-500 to-blue-500'
                        >
                            {
                                ans === "edit" ? (
                                    <i className="ri-check-fill" onClick={handleEdit}></i>
                                ) : (
                                    <i className="ri-send-plane-fill text-md" onClick={handleSendMsg}></i>
                                )
                            }
                        </button>
                    </div>
                </div>
                <div
                ref={contRef}
                className="h-[87%] chat-container relative flex flex-col overflow-auto scrollbar-thin scrollbar-thumb-green-400 scrollbar-track-gray-800 hover:scrollbar-thumb-green-300">
                   {
                    messages?.length !== 0 ? (
                        messages.map((msg: message ,i) => {
                            const prevMsg = messages[i - 1];
                            const isSameUser = prevMsg && prevMsg.User?.name === msg.User?.name && prevMsg?.avtr === msg?.avtr;
                            const addFriend = msg.current?.name === currentUser.name;
                            return (
                                <>
                            <div
                            key={i}
                            className="w-full mb-0.5 rounded-md px-1.5">
                             <Suspense fallback={<p>Lo...</p>}>
                                {
                                !isSameUser && (
                                    <div className="flex mt-2 items-center">
                                <div 
                                className="flex hover:cursor-pointer items-center relative justify-center rounded-full"
                                onClick={() => {
                                    setViewProfile(true)
                                    setCurrentProfile(msg)
                                    console.log("current profile",currentProfile)
                                }}>
                                    {
                                        msg.User?.image ? (
                                            <>
                                            <div className="hover:cursor-pointer">
                                                <Image
                                                 src={msg?.User?.image ? msg.User.image : ""}
                                                 alt="User"
                                                 width={38}
                                                 height={38}
                                                 className="rounded-full object-cover overflow-hidden"
                                               />
                                            </div>
                                           </>
                                        ) : (
                                            <div className="">
                                                <img 
                                                src={msg.avtr} 
                                                alt="user" 
                                                className='h-10 w-10 rounded-full object-cover'
                                                />
                                            </div>
                                        )
                                    }
                                    {
                                        allOnlineUsers && allOnlineUsers.length > 0 && (
                                           allOnlineUsers?.includes(msg.User_id ? msg.User_id : "") ? (
                                            // <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                                            <div className="absolute bottom-0.5 h-3.5 w-3.5 rounded-full -right-0.5 bg-black flex items-center 
                                                        justify-center">
                                                <div className="h-2 w-2 rounded-full bg-green-400"></div>
                                            </div>
                                        ) : (
                                            <div className="text-white absolute top-0 left-0">
                                                <div className="h-2 w-2 rounded-full bg-gray-900"></div>
                                            </div>
                                        )
                                        )
                                    }
                                </div>
                                <div className="flex flex-col w-full flex-1">
                                    <div className="flex items-center">
                                        <div className={`font-bold text-lg ml-2
                                            ${msg.User?.name === currentUser.name ? "text-transparent bg-clip-text bg-gradient-to-b from-green-400 to-blue-400" : ""}`}>
                                            {msg.User?.name}
                                        </div>
                                        <div className="text-center w-[50%] text-gray-400 text-sm font-mono">
                                            {msg.time}
                                        </div>
                                    </div>
                                </div>
                                    </div>
                                )
                             }
                             </Suspense>
                             <div className="w-[60%]">
                                {
                                    msg.reply?.map((rep: any , index) => (
                                        <div
                                        key={index}
                                         className="flex items-center w-full justify-center gap-3">
                                            <div className="w-10 h-0.5 bg-gradient-to-b from-green-300 to-blue-300"></div>
                                            <div className={`overflow-hidden rounded-full ${rep?.current?.name === currentUser.name ? "hidden" : "block"}`}>
                                                {
                                                 rep.User?.image ? (
                                                     <>
                                                     <div className="">
                                                         <Image
                                                          src={rep?.User?.image}
                                                          alt="User"
                                                          width={30}
                                                          height={30}
                                                          className="rounded-full object-cover overflow-hidden"
                                                        />
                                                     </div>
                                                    </>
                                                 ) : (
                                                     <div className="">
                                                         <img 
                                                         src={rep.avtr} 
                                                         alt="user" 
                                                         className='h-10 w-10 rounded-full object-cover'
                                                         />
                                                     </div>
                                                 )
                                             }
                                            </div>
                                            <div className={`${rep?.User?.name === currentUser.name ? "bg-clip-text text-transparent bg-gradient-to-b from-green-200 to-blue-300" : ""}`}>
                                              { rep?.msg }
                                           </div>
                                        </div>
                                    ))
                                }
                             </div>
                              <div className="">
                                <div className={`rounded-xl ml-3 break-words hover:cursor-pointer ${mode === "light" ? "text-black" : "text-gray-100"} text-base`}
                                 onClick={() => handleReplyClick(msg)}
                                 onDoubleClick={() => handleDoubleClick(msg)}>
                                   {msg.msg}
                                </div>
                              </div>
                           </div>
                           </>
                            )
                            })
                    ):(
                        (
                            Text && (
                                <p className="text-2xl font-bold flex gap-2 justify-center items-center h-32">
                                 {Text.map((word, index) => (
                                   <motion.span
                                     key={index}
                                     initial={{ opacity: 0, filter:"blur(15px)", y: -10 }}
                                     animate={{ opacity: 1, filter:"blur(0px)" ,y: 0 }}
                                     transition={{ delay: index * 0.8, duration: 0.8}}
                                     className="text-gray-500"
                                   >
                                     {word}
                                   </motion.span>
                                 ))}
                               </p>
                            )
                        )
                    )}
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 flex flex-wrap lg:max-w-[10vw] md:max-w-[15vw] max-w-[20vw] items-center">
                            {
                              typer && typing && typer.length > 0 && (
                                typer.map((user, index) => {
                                 return (
                                     <Image
                                       src={user}
                                       alt='User'
                                       key={index}
                                       height={20}
                                       width={20}
                                       className='rounded-full object-cover hover:cursor-pointer'
                                     />
                                 )   
                                })
                              )
                            }
                        </div>
                        <div>
                            {
                                typing && typer.length > 0 && <div className="text-sm text-gray-400">Typing....</div>
                            }
                        </div>
                    </div>
                    <div ref={bottomRef}></div>
                    {showScrollButton && (
                     <div
                        onClick={handleScroll}
                        className="fixed z-99 bottom-25 right-15 hover:cursor-pointer">
                            <i className="ri-arrow-up-line"></i>
                        </div>
                     )} 
                     {
                        dclik && (
                            <div className={`p-2 border-l-4 ${mode === "light" ? "bg-white" : "bg-black"} fixed bottom-20 hover:cursor-pointer border-blue-600 text-red-500`}
                            onClick={() => {
                                setAns("")
                                setDClick(false)
                                setThought("")
                                }}>
                                Cancel
                            </div>
                        )
                     }
                     {replyTo && (
                      <div className={`p-2 fixed bottom-20 border-l-4 ${mode === "light" ? "bg-white" : "bg-black"} border-blue-500 mb-2`}>
                        <span className={`text-sm ${mode === "light" ? "text-black" : "text-white"}`}>
                          Replying to: {replyTo.msg}
                        </span>
                        <button
                          onClick={() => {
                            setReplyTo(null)
                            setAns("")
                        }}
                          className="ml-2 hover:cursor-pointer text-red-500 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                </div>           
            </div>
        </div>
        <AnimatePresence>
                {
                  isTrue && (
                    <motion.div
                    //  ref={constRef}
                      initial={{ width: 0, height: 0, opacity: 0, filter: "blur(10px)" }}
                      animate={{
                        width: 400,
                        height: 200,
                        filter: "blur(0px)",
                        opacity: 1,
                        transition: { duration: 0.5, ease: "easeInOut" },
                      }}
                      exit={{
                         width: 0,
                         height: 0,
                         filter: "blur(10px)",
                         opacity: 0,
                         transition: { duration: 0.2, ease: "easeInOut" },
                       }}
                      className="fixed top-1/2 left-1/2 w-[90%] lg:w-[50%] bg-indigo-500 rounded-2xl -translate-x-1/2 -translate-y-1/2 flex p-3 text-white shadow-lg">
                       <div className="w-full">
                        <div className="text-center font-bold w-full text-xl">
                          Fill This!!
                        </div>
                        <div className="">
                          <input type="text" value={formdata.fullName} onChange={handleChange} name='fullName' placeholder='Full Name' className='w-full h-11 border-none outline-none py-1 px-2'/>
                        </div>
                        <div className="">
                          <input type="text" value={formdata.phoneNumber} onChange={handleChange} name='phoneNumber' placeholder='Phone Number' className='w-full h-11 border-none outline-none py-1 px-2'/>
                        </div>
                        <div className="flex items-center mt-3 justify-center">
                          <div className="py-1 px-5 hover:cursor-pointer bg-green-500 text-black rounded-md" 
                          onClick={handleSend}>
                            {
                              stage === "add" && (
                                <span>Add</span>
                              )
                            }
                            {
                              stage === "processing" && (
                                <div className="h-4 w-4 rounded-full border-t border-l animate-spin border-cyan-00"></div>
                              )
                            }
                            {
                                stage === "done" && (
                                    <div className="text-green-300 font-semibold py-1 px-2 bg-black">Successful!</div>
                                )
                            }
                          </div>
                        </div>
                       </div>
                    </motion.div>
                  )
                }
          </AnimatePresence>
        <AnimatePresence>
        {
            viewProfile && (
                <motion.div 
                initial={{ opacity : 0 }}
                animate={{ opacity : 1 }}
                transition={{ duration: 0.5 }}
                exit={{
                    opacity: 0,
                    // y: 100,
                    transition: { duration: 0.8 , ease: "easeInOut"}
                }}
                className="w-full h-screen backdrop-blur-2xl absolute top-0 flex items-center justify-center">
                       <motion.div
                       ref={profileRef}
                       initial={{ opacity: 0 , y: 200}}
                       animate={{ opacity: 1 , y: 0}}
                       transition={{ duration: 0.8}}
                       exit={{ 
                        opacity : 0,
                        y: 100,
                        transition: { duration: 0.5 , ease: "easeInOut" }
                       }}
                       className='w-[95%] lg:w-[50%] h-[60vh] rounded-md p-3 bg-gray-950 absolute bottom-0'>
                         <motion.div
                         className='w-full mt-3 flex items-center justify-center'>
                            <div className="flex relative items-center bg-green-500 justify-center rounded-full">
                                {
                                    currentProfile?.User?.image ? (
                                        <Image
                                          src={currentProfile.User.image}
                                          alt='Profile'
                                          height={40}
                                          width={40}
                                          className='object-cover rounded-full overflow-hidden'
                                        />
                                    ) : (
                                        <img
                                         src={currentProfile?.avtr}
                                         alt='Profile'
                                         className='h-12 w-12 overflow-hidden rounded-full object-cover'
                                        />
                                    )
                                }
                                <div className="absolute z-99 top-0 left-0">
                                    {
                                        allOnlineUsers?.includes(currentProfile?.User_id ? currentProfile.User_id : "") ? (
                                            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                                        ) : (
                                            <div className="text-white">
                                                offline
                                            </div>
                                        )
                                    }
                                </div>
                            </div>
                         </motion.div>
                         <motion.div>
                              {
  currentProfile?.User_id &&
  session?.user.internalId &&
  currentProfile.User_id === session.user.internalId ? (
    <div className="w-full flex items-center justify-center mt-3">
      <div className="w-[80%] bg-green-500 p-2 text-black rounded-md flex items-center justify-center">
        View Profile
      </div>
    </div>

  ) : (
    <div className="w-full flex items-center justify-center mt-3">

      {matchedFriend ? (
        <div
          className="w-[80%] bg-green-500 p-2 text-white rounded-md flex items-center justify-center hover:cursor-pointer"
          onClick={() => {
            if (matchedFriend.conversationId) {
              dispatch(setActiveConversation(matchedFriend.conversationId));
              router.push(`/Chat/${matchedFriend.conversationId}`);
              setLoading(true);
            }
          }}
        >
          {loading ? (
            <span className="p-2 h-4 w-4 border-2 border-white rounded-full animate-spin"></span>
          ) : (
            "Message"
          )}
        </div>

      ) : (
        <div
          className={`w-[80%] p-2 flex items-center justify-center rounded-md hover:cursor-pointer
            ${disabled ? "bg-blue-900 text-gray-700" : "bg-blue-800 text-black"}`}
          onClick={!disabled ? handleSendRequest : undefined}
        >
          {disabled ? "Sent Request" : "Send Friend Request"}
        </div>

      )}

    </div>
  )
}
                         </motion.div>
                       </motion.div>
                </motion.div>
            )
        }
        </AnimatePresence>
        {
            open && (
                <div className="h-screen w-full absolute top-0 left-0 backdrop-blur-2xl bg-opacity-50">
                    <motion.div
                     initial={{ x: -50, width: 0 , height: "100vh"}}
                     animate={{ x: 0 , width: screenSize ? "65vw" : "30vw", height: "100vh"}}
                     transition={{ duration: 0.5 }}
                     ref={containerRef}
                     className={`absolute z-99 top-0 ${mode === "light" ? "bg-white text-black" : "bg-black text-white"} shadow-cyan-500 shadow left-0 py-5 px-3 md:p-5`}
                     >
                         <div className="h-full flex flex-col justify-between">
                            <div className="">
                               <div className="">
                                 <h1 className='text-transparent bg-clip-text bg-gradient-to-b from-green-600 to-blue-600 text-xl md:text-2xl'>OpenChat</h1>
                                 <div className="h-[7vh] px-3 w-full flex items-center justify-between">
                                    <span className='md:text-xl hover:cursor-pointer'>General</span>
                                    <div className="flex items-center justify-center gap-1">
                                        <span className='h-2.5 w-2.5 rounded-full bg-green-500'></span>
                                        <span className=''>{onlineCount}</span>
                                    </div>
                                 </div>
                               </div>
                               <div className="">
                                <div
                                className="font-bold h-[75vh]">
                                    <div className="flex items-center justify-between gap-0.5">
                                       <span className='w-full h-0.5 rounded-md bg-gradient-to-l from-blue-500 to-black'></span>
                                       <span>Friends</span>
                                       <span className='w-full h-0.5 rounded-md bg-gradient-to-l from-black to-blue-500'></span>
                                    </div>
                                    <div className="py-2 h-[70vh] overflow-auto">
                                        <div className="flex flex-col gap-2">
                                            {
                                                conversations.length > 0 ? (
                                                        conversations.map((convo , index) => {
                                                            console.log("convoooo",convo);
                                                            return (
                                                              <div className="flex relative hover:cursor-pointer items-center justify-between px-2 py-0.5 rounded-md gap-2 w-full"
                                                              key={index}
                                                              onClick={() => {
                                                                dispatch(setActiveConversation(convo.convo._id))
                                                                router.push(`/Chat/${convo.convo._id}`);
                                                              }}>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-9 relative w-9 rounded-full">
                                                                        <Image 
                                                                          src={convo?.otherUser?.image ? convo.otherUser?.image : ""}
                                                                          alt='User'
                                                                          height={35}
                                                                          width={35}
                                                                          className='h-8 w-8 rounded-full object-cover'
                                                                        />
                                                                        <div className="absolute h-4 w-4 bg-black rounded-full flex items-center justify-center bottom-0 right-0 ">
                                                                            {
                                                                                allOnlineUsers.includes(convo?.otherUser?.uniqueUserId ? convo.otherUser.uniqueUserId  :"") ? (
                                                                                    // <div className="h-4 w-4 flex items-center">
                                                                                        <div className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse"></div>
                                                                                    // </div>
                                                                                ) : (
                                                                                    <div className="h-2.5 w-2.5 rounded-full bg-red-400"></div>
                                                                                )
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                    <div className="relative">
                                                                        <div className="mb-3.5">
                                                                            {convo?.otherUser?.fullName}                                                                       
                                                                        </div>
                                                                        <div className="lg:text-[1vw] md:text-[2.4vw] sm:text-[2.8vw] text-[3.4vw]">
                                                                           {
                                                                            typing ? (
                                                                                conve === convo.convo._id && <small className='italic absolute top-4.5'>Typing.....</small>
                                                                            ) : (
                                                                            convo.message === 0 ? ( 
                                                                              convo.convo.lastMessage?.senderId !== session?.user?.internalId 
                                                                                ? <small className='font-light absolute top-4.5 lg:w-[20vw] md:w-[18vw] sm:w-[25vw] w-[30vw] truncate tracking-widest'>{convo.convo.lastMessage?.text}</small>
                                                                                : <small className='font-light absolute top-4.5 lg:w-[20vw] md:w-[18vw] sm:w-[25vw] w-[33vw] truncate tracking-widest'>{
                                                                                    allOnlineUsers.includes(convo.otherUser?.uniqueUserId ? convo.otherUser.uniqueUserId : "") ? (
                                                                                        <small className="">Sent</small>
                                                                                    ) : (
                                                                                        <small className="">{formatLastActive(convo.otherUser?.lastActive ? convo.otherUser.lastActive : "")}</small>
                                                                                    )
                                                                                }</small>
                                                                            ) : (
                                                                                <div className="">
                                                                                    {
                                                                                        convo.message === 1 ?
                                                                                         <small className='absolute top-4.5'>{convo.convo.lastMessage?.text}</small>
                                                                                         : (
                                                                                            convo.message && convo.message > 4 ? (
                                                                                            <small className='font-light absolute top-4.5 lg:w-[20vw] md:w-[18vw] sm:w-[25vw] w-[30vw] truncate tracking-widest'>
                                                                                               {4}+ New Messages
                                                                                            </small>
                                                                                        ) : (
                                                                                            <small className='italic font-light absolute top-4.5 lg:w-[20vw] md:w-[18vw] sm:w-[25vw] w-[30vw] truncate tracking-widest'>
                                                                                              {convo.message} New Message
                                                                                            </small>
                                                                                        )
                                                                                         )
                                                                                    }
                                                                                </div>
                                                                            )                                                 
                                                                            )
                                                                           }
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {
                                                                   convo.message && convo.message > 0 ? <div className="h-2 w-2 rounded-full bg-blue-500"></div> : <div className=""></div>
                                                                }
                                                              </div>
                                                            )
                                                         })
                                                ) : (
                                                    <div className="font-bold italic ml-5">
                                                        Make some friends
                                                    </div>
                                                )
                                            }
                                        </div>
                                    </div>
                                </div>
                               </div>
                            </div>
                            <div className="h-[10vh] flex items-center justify-between hover:cursor-pointer">
                                <div className="h-10 relative w-10 flex items-center justify-center overflow-hidden">
                                    <Image 
                                    src={currentUser.image ? currentUser.image : avtr}
                                    alt='profile'
                                    width={25}
                                    height={25}
                                    className='h-9 w-9 rounded-full object-cover'
                                    />
                                    <div className="absolute bottom-0 bg-black right-0 flex items-center rounded-full justify-center h-3.5 w-3.5">
                                        {
                                            allOnlineUsers.includes(session?.user.internalId ? session.user.internalId : "") && <div className="h-2 w-2 rounded-full bg-green-600"></div>
                                        }
                                    </div>
                                </div>
                                <div className="" onClick={() => signOut()}>
                                    Logout
                                </div>
                            </div>
                         </div>
                    </motion.div>
                </div>
            )
        }
    </div>
  )
}

export default Page

function prev(value: message, index: number, array: message[]): message {
    throw new Error('Function not implemented.');
}