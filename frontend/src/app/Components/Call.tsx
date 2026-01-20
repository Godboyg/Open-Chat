import React from 'react'
import { motion , AnimatePresence } from 'motion/react'
import { RefObject } from "react";
import { span } from 'framer-motion/client';
import Typing from '../Chat/[id]/Typing';

interface props {
    callState: string;
    localVideo: RefObject<HTMLVideoElement | MediaStream | null>;
    remoteVideo: RefObject<HTMLVideoElement | MediaStream | null>;
    onAccept: () => void;
    onEndCall: () => void;
    other: any;
    user: boolean
}

function Call({ callState , localVideo , remoteVideo , onAccept , onEndCall , other , user}: props) {

  return (
    <div className="p-3">
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
                 initial={{ opacity:0.5 , y:110 }}
                 animate={{ y:0 , opacity:1 }}
                 transition={{ duration: 0.2 }}
                >
                    <div className="w-full bg-green-400 absolute left-0 h-screen top-0 z-999 backdrop-blur-sm flex flex-col gap-5 items-center justify-between">
                        <div className="flex flex-col gap-3">
                            <div className="">
                                {other.otherUser.fullName}
                            </div>
                            <div className="">
                                { user ? <span>Ringing <Typing/></span> : <span>Calling <Typing /></span> }
                            </div>
                        </div>
                        <div>
                              {/* {callState === "idle" && (
                                <button onClick={startCall}>📞</button>
                              )} */}
                        
                              {callState === "ringing" && (
                                <>
                                  <button onClick={onAccept}>✅ Accept</button>
                                  <button onClick={onEndCall}>❌ Reject</button>
                                </>
                              )}
                        
                              {callState === "connected" && (
                                <button onClick={onEndCall}>🔴 End</button>
                              )}
                        
                              <video ref={localVideo} autoPlay className="w-40 h-40 rounded-lg object-cover" />
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
