import React, { useState } from 'react'
import { RefObject } from "react";
import Image from 'next/image';
import { Session } from 'next-auth';

interface props {
    callState: string;
    localVideo: RefObject<HTMLVideoElement | null>;
    remoteVideo: RefObject<HTMLVideoElement | null>;
    onAccept: () => void;
    onEndCall: () => void;
    other: any;
    user: boolean;
    stream?: MediaStream | null;
    caller: string | null;
    session: Session | null;
    remote: boolean;
    cameraOn: boolean;
    speakerOn: boolean;
    micOn: boolean;
    toggleSpeaker: () => void;
    toggleCamera: () => void;
    toggleMic: () => void;
    remoteStream?: MediaStream | null;
}

function Call({
  callState,
  localVideo,
  remoteVideo,
  onAccept,
  onEndCall,
  other,
  user,
  stream,
  remoteStream,
  session,
  cameraOn,
  micOn,
  toggleCamera,
  toggleMic,
  toggleSpeaker,
  speakerOn,
  remote,
}: props) {

  const [shink, setShink] = useState(false);
  const [small, setSmall] = useState(false);

  return (
<div className={`inset-0 absolute transition-all duration-400 ease-in lg:w-[65%] w-full top-0 left-1/2 -translate-x-1/2 z-99 backdrop-blur-sm text-white
    ${shink ? "h-[7vh]" : "h-screen overflow-hidden bg-black/50"}`}>
      <div className="absolute inset-0 z-10 pointer-events-none">
        <video
          ref={localVideo}
          autoPlay
          playsInline
          className={`
            pointer-events-auto
            object-cover rounded-lg transition-all duration-300 ease-in-out
            ${cameraOn ? "block" : "hidden"}
            ${
              shink
                ? small
                  ? "absolute top-2 left-1/2 -translate-x-1/2 w-20 h-14 z-99999"
                  : "absolute top-2 left-1/2 -translate-x-1/2 w-40 h-24 z-99999"
                : "w-full h-full"
            }
          `}
        />
        {
                                !remote && callState === "connected" && (
                                    <div className={`rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center ${
                shink
                  ? "fixed top-2 right-2 w-20 h-14 z-99"
                  : "absolute top-5 right-5 w-40 h-60 z-99"
              }`}>
                                         <div className="">
                                                    <Image 
                                                         src={
                                      session?.user.image?.startsWith("http")
                                        ? session.user.image
                                        : `${process.env.NEXT_PUBLIC_API_URL}${session?.user.image}`
                                    }
                                                         alt='user'
                                                         height={45}
                                                         width={45}
                                                         className='rounded-full object-cover'
                                                    />
                                            </div>
                                      </div>
                                )
                            }
        <video
            ref={remoteVideo}
            autoPlay
            playsInline
            className={`
              pointer-events-auto
              object-cover rounded-lg transition-all duration-300
              ${remote ? "block" : "hidden"}
              ${
                shink
                  ? "fixed top-2 right-2 w-20 h-14 z-[9999]"
                  : "absolute top-5 right-5 w-40 h-60 z-[9999]"
              }
            `}
          />

      </div>
      {shink && (
        <div
          className="absolute top-0 left-0 w-full z-20 p-2 flex items-center justify-between"
        >
          <div
            className="cursor-pointer"
            onClick={() => {
              setSmall(!small);
            }}
          >
            ⬍
          </div>

          <p onClick={() => setShink(!shink)}>
            {callState !== "connected"
              ? user ? "Ringing..." : "Calling..."
              : ""}
          </p>

          <button onClick={onEndCall}>🔴 End</button>
        </div>
      )}
      {
                             !shink && callState === "calling" && ( 
                                    <div className="flex items-center p-2 rounded-2xl justify-between absolute w-[90%] left-5 px-5 bottom-7 z-999">
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
                                         <div className="">
                                            <button onClick={toggleSpeaker}>
                                              {speakerOn ? <i className="ri-volume-down-line text-xl"></i> : <i className="ri-volume-up-line text-xl"></i>}
                                            </button> 
                                        </div>
                                        <div>
                                          <button 
                                          className='px-4 py-2 border-cyan-500 border-2 hover:cursor-pointer rounded-xl' onClick={onEndCall}>🔴 End</button>
                                        </div>
                                        <div className="hover:cursor-pointer rounded-full p-2" 
                            onClick={() => {
                                setShink(!shink);
                                setSmall(false);
                            }}>
                                <i className="ri-arrow-down-s-line text-xl"></i>
                            </div>
                                    </div>
                              )}
      {!shink && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6">

          {!cameraOn && (
            <>
            <img
              src={other?.otherUser?.image}
              alt="user"
              className="w-20 h-20 rounded-full object-cover"
            />

            <h2>{other?.otherUser?.fullName}</h2>
            </>
          )}

          {callState !== "connected" && (
            <p>{user ? "Ringing..." : "Calling..."}</p>
          )}

          {callState === "ringing" && (
            <div className="flex gap-5">
              <button
                className="bg-green-500 px-4 py-2 rounded-xl"
                onClick={onAccept}
              >
                Accept
              </button>
              <button
                className="bg-red-500 px-4 py-2 rounded-xl"
                onClick={onEndCall}
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}
      {callState === "connected" && !shink && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2
                        bg-black/50 backdrop-blur-sm rounded-2xl px-6 py-3
                        flex gap-6 items-center z-999">

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
                                        <div className="">
                                            <button onClick={toggleSpeaker}>
                                              {speakerOn ? <i className="ri-volume-down-line text-xl"></i> : <i className="ri-volume-up-line text-xl"></i>}
                                            </button> 
                                        </div>
                                        <div>
                                          <button 
                                          className='px-4 py-2 border-cyan-500 border-2 hover:cursor-pointer rounded-xl' onClick={onEndCall}>🔴 End</button>
                                        </div>
                                        <div className="hover:cursor-pointer rounded-full p-2" 
                            onClick={() => {
                                setShink(!shink);
                                setSmall(false);
                            }}>
                                <i className="ri-arrow-down-s-line text-xl"></i>
                            </div>

        </div>
      )}
    </div>
  );
}

export default Call;