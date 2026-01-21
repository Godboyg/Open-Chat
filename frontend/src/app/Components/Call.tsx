import React, { useState } from 'react'
import { motion , AnimatePresence } from 'motion/react'
import { RefObject } from "react";
import Image from 'next/image';
import { emit } from '@/lib/socket';
import { toggleCamera, toggleMic } from './mediaControls';
import { Session } from 'next-auth';
import { p } from 'framer-motion/client';

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
}

function Call({ callState , localVideo , remoteVideo , onAccept , onEndCall , other , user , stream , caller , session}: props) {

    const [micOn, setMicOn] = useState<boolean>(true);
    const [cameraOn, setCameraOn] = useState<boolean>(false);

    console.log("callwer",caller, session);

     const handleMicToggle = () => {
       if (!stream) return;
       toggleMic(stream);
       setMicOn(prev => !prev);
     };

    const handleCameraToggle = () => {
      if (!stream) return;
      toggleCamera(stream);
      setCameraOn(prev => !prev);
    };

  return (
    <div className="p-3 h-screen z-999 backdrop-blur-sm inset-0 w-full absolute top-0 left-0">
        <AnimatePresence>
            <motion.div
             initial={{ opacity : 0 }}
             animate={{ opacity : 1 }}
             transition={{ duration: 0.5 }}
             exit={{
                opacity: 0,
                y: 100,
                transition: { duration: 0.8 , ease: "easeInOut"}
            }}
            >
                <motion.div
                 initial={{ opacity: 0, y: 200 }}
                 animate={{ y: 0 , opacity: 1 }}
                 transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                    <div className="lg:w-[65%] absolute z-999 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full bg-black/50 h-screen flex flex-col gap-5 items-center justify-between">
                        <div className="flex flex-col absolute z-99 top-10 left-0 gap-2 w-full mt-20 items-center justify-center">
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
                                        <p>Connected...</p>
                                     )
                                }
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
                                callState === "connected" && <div className="px-10 py-16 rounded-xl backdrop-blur-sm flex items-center justify-center absolute top-0 z-999 right-0">
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
                              }
                        
                              {callState === "connected" && (
                                <div className="flex items-center justify-between absolute w-[90%] left-5 px-5 bottom-10 z-99">
                                        <div className="">
                                            {
                                                cameraOn ? (
                                                    <div className="p-1 rounded-full flex items-center justify-center">
                                                       <i className="ri-video-off-line text-sm" onClick={handleCameraToggle}></i>
                                                    </div>
                                                ) : (
                                                    <div className="p-1 rounded-full flex items-center justify-center">
                                                        <i className="ri-video-on-line text-sm" onClick={handleCameraToggle}></i>
                                                    </div>
                                                )
                                            }
                                        </div>
                                        <div className="">
                                            <button onClick={handleMicToggle}>
                                              {micOn ? <i className="ri-mic-line"></i> : <i className="ri-mic-off-line"></i>}
                                            </button>
                                        </div>
                                        <div>
                                          <button 
                                          className='px-4 py-2 border-cyan-500 border-2 hover:cursor-pointer rounded-xl' onClick={onEndCall}>🔴 End</button>
                                        </div>
                                    </div>
                              )}
                              <div className="absolute z-9 h-screen w-full top-0 left-0">
                                  <video ref={localVideo} autoPlay className="w-full h-full rounded-lg object-cover" />
                              </div>
                              {
                                caller === session?.user.internalId && (
                                    <div className="flex items-center justify-between absolute w-[90%] left-5 px-5 bottom-10 z-99">
                                        <div className="">
                                            {
                                                cameraOn ? (
                                                    <div className="p-1 rounded-full flex items-center justify-center">
                                                       <i className="ri-video-off-line text-sm" onClick={handleCameraToggle}></i>
                                                    </div>
                                                ) : (
                                                    <div className="p-1 rounded-full flex items-center justify-center">
                                                        <i className="ri-video-on-line text-sm" onClick={handleCameraToggle}></i>
                                                    </div>
                                                )
                                            }
                                        </div>
                                        <div className="">
                                            <button onClick={handleMicToggle}>
                                              {micOn ? <i className="ri-mic-line"></i> : <i className="ri-mic-off-line"></i>}
                                            </button>
                                        </div>
                                        <div>
                                          <button 
                                          className='px-4 py-2 border-cyan-500 border-2 hover:cursor-pointer rounded-xl' onClick={onEndCall}>🔴 End</button>
                                        </div>
                                    </div>
                                )}
                              <video ref={remoteVideo} autoPlay className="w-40 h-40 rounded-lg object-cover"/>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    </div>
  )
}

export default Call
