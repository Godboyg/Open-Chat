import React, { useEffect, useRef, useState } from 'react'
import { motion , AnimatePresence, secondsToMilliseconds, useAnimation } from 'motion/react'
import { RefObject } from "react";
import Image from 'next/image';
import { emit } from '@/lib/socket';
import { toggleCamera, toggleMic } from './mediaControls';
import { Session } from 'next-auth';
import peer from '@/webrtc/peer';
import { video } from 'framer-motion/client';

interface props {
    callState: string;
    localVideo: RefObject<HTMLVideoElement | null>;
    remoteVideo: RefObject<HTMLVideoElement | null>;
    onAccept: () => void;
    onEndCall: () => void;
    other: any;
    user: boolean;
    stream: MediaStream | null;
    caller: string | null;
    session: Session | null;
    remote: boolean;
    cameraOn: boolean;
    micOn: boolean;
    toggleCamera: () => void;
    toggleMic: () => void;
    remoteStream: MediaStream | null;
}

function Call({ callState , localVideo , remoteVideo , onAccept , onEndCall , other , user , stream , caller , remote , session, cameraOn,
  micOn, toggleCamera, toggleMic , remoteStream}: props) {

    const [shift , setShift] = useState(false);

    const controls = useAnimation();

    console.log("shift!!1",shift);
    const [shink , setShink] = useState(false);
    const [small , setSmall] = useState(false);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const videoRemoteRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        controls.start({
            width: "5%",
            opacity: 1,
            transition: {
              delay: 1,
              type: "spring",
              stiffness: 180,
              damping: 18,
            },
        })
    },[controls])

    useEffect(() => {
        if(videoRef.current) {
            videoRef.current.srcObject = stream;
        }
        if(videoRemoteRef.current) {
            videoRemoteRef.current.srcObject = remoteStream;
        }
    },[stream , shink , small])

  return (
    <div className={`p-3 w-full absolute top-0 left-0 bg-black/50
    transition-all duration-600 ease-in-out ${shink ? "h-[10%]" : "h-screen"}`}>
        <AnimatePresence>
            <motion.div
             initial={{ opacity : 0 }}
             animate={{ opacity : 1 }}
             transition={{ duration: 0.5 }}
             exit={{
                opacity: 0,
                // y: 100,
                transition: { duration: 0.8 , ease: "easeInOut"}
            }}
            >
                <motion.div
                 initial={{ opacity: 0, y: 200 }}
                 animate={{ y: 0 , opacity: 1 }}
                 transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                    {
                        shink ? (
                            <motion.div 
                            initial={{ opacity: 1 }}
                            animate={controls}
                            drag="y"
                            dragSnapToOrigin
                            dragConstraints={{ top: 15, bottom: 0 }}
                            onDragEnd={(e, info) => {
                               if (info.offset.y < -1) {
                                 setSmall(!small);
                              } else {
                                controls.start({
                                  y: 0,
                                  transition: { type: "spring", stiffness: 200 },
                                });
                              }
                            }}
                            className={`absolute z-999 ${small ? "" : "backdrop-blur-sm"} rounded-md top-0 left-1/2 -translate-x-1/2 lg:w-[65%] w-full h-full`}
                            >
                                <div className="rounded-md"
                                onClick={() => {
                                    setShink(!shink);
                                    setShift(!shift);
                                    console.log(shift)
                                    }}>
                                    {
                                        small ? (
                                             <div className="w-full flex items-center justify-center absolute z-99 top-0 text-white"
                                             onClick={() => setSmall(false)}>
                                                <div className="rounded-xl bg-gradient-to-r from-blue-500 to-green-500 p-1">
                                                    <div className="flex items-center gap-2">
                                            <div className="">
                                              {
                                                cameraOn ? (
                                                    <div className="">
                                                        <video ref={videoRef} autoPlay playsInline className="w-10 h-10 rounded-lg object-cover"/>
                                                    </div>
                                                ) : (
                                                    <Image 
                                                     src={other.otherUser.image}
                                                     alt='user'
                                                     height={20}
                                                     width={20}
                                                     className='rounded-full object-cover'
                                                    />
                                                )
                                              }
                                            </div>
                                            <div className="">
                                            {
                                             callState !== "connected" ?
                                                <p>{ user ? <small>Ringing...</small> : <small>Calling...</small>}</p>
                                               : (
                                               <p></p>
                                              )
                                            }
                                            </div>
                                          </div>
                                                </div>
                                             </div>
                                        ) : (
                                            <div className="flex items-center justify-between px-3 py-2 gap-3 w-full absolute z-99 top-0 left-0">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-3">
                                              {
                                                cameraOn ? (
                                                    <div className="">
                                                        <video ref={videoRef} autoPlay playsInline className="w-10 h-10 rounded-lg object-cover"/>
                                                    </div>
                                                ) : (
                                                    <Image 
                                                     src={other.otherUser.image}
                                                     alt='user'
                                                     height={40}
                                                     width={40}
                                                     className='rounded-full object-cover'
                                                    />
                                                )
                                              }
                                            </div>
                                            <div className="">
                                            {
                                             callState !== "connected" ?
                                                <p>{ user ? <span>Ringing...</span> : <span>Calling...</span> }</p>
                                               : (
                                               <p></p>
                                              )
                                            }
                                            </div>
                                        </div>
                                        {
                                            ( callState === "calling" || callState === "ringing" ) && <div className="">
                                            <button 
                                              className='lg:px-4 lg:py-2 px-2.5 py-1.5 border-cyan-500 border-2 hover:cursor-pointer rounded-xl' onClick={onEndCall}>🔴 End</button>
                                            </div>
                                        }
                                        {
                                            callState === "connected" && <div className={`rounded-xl bg-black/50 flex items-center justify-center absolute top-5 z-999 right-0
                                            ${remote ? "block" : "hidden"}`}>
                                                <video ref={remoteVideo} autoPlay playsInline className="w-10 h-10 rounded-lg object-cover"/>
                                            </div>
                                        }
                           
                                        {
                                            !remote && callState === "connected" && (
                                                <div className="px-12 py-20 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center absolute top-5 z-999 right-0">
                                                     <div className="">
                                                                <Image 
                                                                     src={session?.user.image ? session.user.image : ""}
                                                                     alt='user'
                                                                     height={40}
                                                                     width={40}
                                                                     className='rounded-full object-cover'
                                                                />
                                                        </div>
                                                  </div>
                                            )
                                           }
                                    </div>
                                        )
                                    }
                                </div>
                            </motion.div>
                        ) : (
                            <div className={`lg:w-[65%] absolute z-999 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex flex-col gap-5 items-center justify-between
                        ${shink ? "" : "backdrop-blur-sm h-screen bg-black/50"}`}>
                        <div className={`absolute h-screen z-99 transition-all duration-400 ease-out
                           gap-2 w-full`}>
                            <div className="h-full w-full">
                                {
                                    !cameraOn && (
                                    <div className={`flex items-center flex-col justify-center absolute w-full mt-20 ${callState === "connected" ? "top-60 translate-y-0" : "top-10"}`}>
                                        <div className="">
                                            <Image 
                                              src={other.otherUser.image}
                                              alt='user'
                                              height={65}
                                              width={65}
                                              className='rounded-full object-cover'
                                              />
                                        </div>
                                         <div className="">
                                             <p className='text-center'>{other.otherUser.fullName}</p>
                                             {
                                                 callState !== "connected" ?
                                                  <p>{ user ? <span>Ringing...</span> : <span>Calling...</span> }</p>
                                                  : (
                                                     <p></p>
                                                  )
                                             }
                                         </div>
                                    </div>
                                    )
                                }
                            </div>
                        </div>
                        <div className="absolute top-5 w-[90%] z-99 p-1.5">
                            <div className="hover:cursor-pointer" 
                            onClick={() => {
                                setShink(!shink);
                                // toggleCamera();
                                setShift(!shift);
                                console.log("shift",shift);
                                }}>
                                <i className="ri-arrow-down-s-line text-xl"></i>
                            </div>
                        </div>
                        <div>
                              {callState === "ringing" && (
                                <>
                                  <div className="w-full absolute z-99 bottom-10 left-0 flex items-center justify-center">
                                    <div className="w-[90%] flex items-center justify-between">
                                    <button
                                  className='text-gray-800 hover:cursor-pointer bg-blue-500 px-4 py-1.5 rounded-xl
                                  '
                                   onClick={onAccept}>Accept</button>
                                  <button
                                  className='text-red-800 hover:cursor-pointer bg-blue-500 px-4 py-1.5 rounded-xl'
                                   onClick={onEndCall}>Reject</button>
                                  </div>
                                  </div>
                                </>
                              )}
                            
                            {
                                callState === "connected" && <div className={`rounded-xl bg-black/50 flex items-center justify-center absolute top-5 z-999 right-0
                                ${remote ? "block" : "hidden"}`} >
                                    <video ref={remoteVideo} autoPlay playsInline className="w-40 h-60 rounded-lg object-cover"/>
                               </div>
                            }
                           
                            {
                                !remote && callState === "connected" && (
                                    <div className="px-12 py-20 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center absolute top-5 z-999 right-0">
                                         <div className="">
                                                    <Image 
                                                         src={session?.user.image ? session.user.image : ""}
                                                         alt='user'
                                                         height={45}
                                                         width={45}
                                                         className='rounded-full object-cover'
                                                    />
                                            </div>
                                      </div>
                                )
                            }
                            
                        
                              {callState === "connected" &&  (
                                <div className="flex items-center justify-between absolute w-[90%] bg-black/50 p-2.5 rounded-2xl left-5 px-5 bottom-7 z-99">
                                        <div className="">
                                            {
                                                cameraOn ? (
                                                    <div className="p-1 rounded-full flex items-center justify-center">
                                                       <i className="ri-video-off-line text-xl" onClick={toggleCamera}></i>
                                                    </div>
                                                ) : (
                                                    <div className="p-1 rounded-full flex items-center justify-center">
                                                        <i className="ri-video-on-line text-xl" onClick={toggleCamera}></i>
                                                    </div>
                                                )
                                            }
                                        </div>
                                        <div className="">
                                            <button onClick={toggleMic}>
                                              {micOn ? <i className="ri-mic-line text-xl"></i> : <i className="ri-mic-off-line text-xl"></i>}
                                            </button> 
                                        </div>
                                        <div>
                                          <button 
                                          className='px-4 py-2 border-cyan-500 border-2 hover:cursor-pointer rounded-xl' onClick={onEndCall}>🔴 End</button>
                                        </div>
                                    </div>
                              )}
                              <div className={`h-screen w-full ${shink ? "hidden" : "block"}`}>
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full rounded-lg object-cover"/>
                              </div>
                            {
                               callState === "calling" && ( 
                                    <div className="flex items-center bg-black/50 p-2.5 rounded-2xl justify-between absolute w-[90%] left-5 px-5 bottom-7 z-99">
                                        <div className="">
                                            {
                                                cameraOn ? (
                                                    <div className="p-1 rounded-full flex items-center justify-center">
                                                       <i className="ri-video-off-line text-xl" onClick={toggleCamera}></i>
                                                    </div>
                                                ) : (
                                                    <div className="p-1 rounded-full flex items-center justify-center">
                                                        <i className="ri-video-on-line text-xl" onClick={toggleCamera}></i>
                                                    </div>
                                                )
                                            }
                                        </div>
                                        <div className="">
                                            <button onClick={toggleMic}>
                                              {micOn ? <i className="ri-mic-line text-xl"></i> : <i className="ri-mic-off-line text-xl"></i>}
                                            </button> 
                                        </div>
                                        <div>
                                          <button 
                                          className='px-4 py-2 border-cyan-500 border-2 hover:cursor-pointer rounded-xl' onClick={onEndCall}>🔴 End</button>
                                        </div>
                                    </div>
                              )} 
                        </div>
                    </div>
                        )
                    }
                </motion.div>
            </motion.div>
        </AnimatePresence>
    </div>
  )
}

export default Call