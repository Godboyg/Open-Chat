"use client"
import axios from 'axios'
import { motion , useAnimation } from 'motion/react'
import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { NotificationType } from '../General/page'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { Friend, removeFriendRequest } from '@/redux/friendSlice'
import { removeNotification } from '@/redux/notificationSlice'

type props = {
  isOn: boolean,
  onIs: (data: boolean) => void,
  notification: NotificationType[],
  close: (data: boolean) => void,
  accepted: (data: Friend) => void
}

function Notification({ onIs , close , accepted , notification }: props) {

  const controls = useAnimation();
  const { data: session } = useSession();

  const [loading , setLoading] = useState<boolean>(true);
  const [click , isClick ] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const notificationReceived = useAppSelector((state) => state.friends.requests);
  const friens = useAppSelector((state) => state.friends.friends);
  const pendingNotification = useAppSelector((state) => state.notifications.items);
  console.log("penfins",pendingNotification);
  const sfiub = useAppSelector((state) => state.conversations.allIds);
  console.log("notoi",notificationReceived , notification);

  useEffect(() => {
    try{
      const allNotification = async() => {
        const res = await axios.get("/api/app/notification", {
          params : {
            userId: session?.user.internalId
          }
        })

        console.log("Response" , res.data);
        console.log("Response" , res.data.allNotification);
      }

      allNotification();
    } catch(error) {
      console.log("error",error);
    }
  },[friens , session?.user.internalId])

  useEffect(() => {
    setTimeout(() => {
       setLoading(false);
    }, 1140);

    controls.start({
      width: window.innerWidth > 1024 ? "35%" : "90%",
      y: 20,
      opacity: 1,
      transition: {
        delay: 1,
        type: "spring",
        stiffness: 180,
        damping: 18,
      },
    });
  }, [controls]);

  return (
    <motion.div
      initial={{ y: 0 , width: "5%" }}
      animate={controls}
      transition={{ duration: 1 , type: "spring" , stiffness: 150 , damping: 20 }}
      drag="y"
      dragSnapToOrigin
      dragConstraints={{ top: 5, bottom: 0 }}
      exit={{ 
        y: 5,
        opacity: 0,
        transition: {
            duration: 0.8
        }
      }}
      onDragEnd={(e, info) => {
        if (info.offset.y < -20) {
          controls.start({
            y: 0,
            width: "5vw",  
            opacity: 0,     
            transition: {
              // delay: 2,
              type: "spring",
              stiffness: 200,
              damping: 20,
            },
          });

          onIs(false);
        } else {
          controls.start({
            y: 0,
            transition: { type: "spring", stiffness: 200 },
          });
        }
      }}
      className='absolute top-0 p-2 z-99 lg:w-[60%] w-[80%] rounded-md text-white bg-black'>
        {
          loading ? (
            <div className="w-full flex items-center justify-center">
              <div className="h-4 w-4 rounded-full border-l-2 border-r-2 border-b-2 border-cyan-700 animate-spin"></div>
            </div>
          ) : (
            <div className="w-full p-2 rounded-md border border-cyan-400">
              {
                pendingNotification.length > 0 && (
                  <div className="max-w-full">
                    {
                      pendingNotification.map((pending) => 
                        pending.message === "REQUEST_RECEIVED" && (
                        <div className="flex items-center gap-2 max-w-full px-3 py-1 bg-black shadow shadow-cyan-600">
                          <div className="text-lg font-semibold">
                            {pending.message}
                          </div>
                          <div className="h-3 w-3 rounded-full bg-green-400"></div>
                        </div>
                      ))
                    }
                  </div>
                )
              }
                  <div className="w-full">
                    <div className="w-full flex flex-col gap-1">
                {
                  notificationReceived.map((notify , index) => 
                    notify.image && (
                    <div className="flex items-center justify-between gap-2 w-full"
                    key={index}>
                       <div className="flex items-center gap-3">
                         <div className="h-8 w-8 hover:cursor-pointer rounded-full overflow-hidden">
                          <Image 
                            src={
                                      notify.image?.startsWith("http")
                                        ? notify.image
                                        : `${process.env.NEXT_PUBLIC_API_URL}${notify.image}`
                                    }
                            alt='show'
                            height={34}
                            width={34}
                            className='rounded-full object-cover'
                          />
                        </div>
                        <div className="">
                          <div className="flex flex-col">
                            <p className='font-bold text-md'>{notify.name}</p>
                            <p className='font-light text-sm'>Sent u a friend request.</p>
                          </div>
                        </div>
                       </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex text-md items-center hover:cursor-pointer justify-center"
                          onClick={() => {
                            accepted(notify)
                            isClick(true)
                            onIs(false)
                          }}>
                            {!click ? 
                            <div className="h-full w-full bg-blue-600 text-white px-3 py-1.5 rounded-md">Accept</div> : <div className="h-full w-full px-3 rounded-md py-1.5 bg-white text-black">Message</div> }
                          </div>
                          <div className="">
                            <i className="ri-close-line hover:cursor-pointer" onClick={() => {
                              if(notificationReceived.length <= 1) {
                                close(false);
                              }
                              dispatch(removeFriendRequest({ to: notify._id, from: notify.to ? notify.to : "" }))
                            }}></i>
                          </div>
                        </div>
                    </div>
                  ))
                }
                    </div>
                 </div>
            </div>
          )
        }
    </motion.div>
  )
}

export default Notification