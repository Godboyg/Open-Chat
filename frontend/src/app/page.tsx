"use client"
import React, { useEffect, useState } from 'react'
import { signIn , useSession } from 'next-auth/react'
import Auth from './Components/Auth';
import { useAppDispatch , useAppSelector } from '@/redux/hooks';
import { toggleTheme } from '@/redux/themeSlice';
import { motion } from 'motion/react';
import 'remixicon/fonts/remixicon.css';
import Dots from './Components/Dots';
import { useRouter } from 'next/navigation';
import RunningBorderBox from './Components/RunningBorderBox';
import axios from "axios"

interface User {
  name: string | null | undefined;
  email: string | null | undefined;
  photo: string | null | undefined;
}

function Page() {

  const router = useRouter();

  const {data: session , status } = useSession();
  const [animate, setAnimate] = useState<boolean>(false);
  const [screenSize , setScreenSize] = useState<boolean>(false);
  const [open , setOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User>({
    name: "",
    email: "",
    photo: "",
  });
  useEffect(() => {
    console.log("session",session);
    setUser({
      name: session?.user?.name,
      email: session?.user?.email,
      photo: session?.user?.image
    })
  },[session])

  // useEffect(() => {

  //    const socket = getSocket();

  //   axios.get("http://localhost:9100/api").then((res) => {
  //     console.log("msg",res.data);
  //   })

  //   socket.onopen = () => {
  //     console.log('✅ Connected to server')
  //     socket.send('Hello server!')
  //   }

  //   socket.onmessage = (event: any) => {
  //     const data = JSON.parse(event.data);
  //     console.log('📩 Message from server:', data)
  //   }

  //   socket.onclose = () => {
  //     console.log('❌ WebSocket disconnected')
  //   }
  // },[])

  useEffect(() => {
    const fetchUser = async() => {
       try{
      const res = await axios.get("/api/app/user/current" , {
        params: {
          uniqueUserId: session?.user.internalId
        }
      })
      console.log("response ", res?.data.Message);
      // if(res.data.Message === "User not found!" && status === "authenticated"){
      //   console.log("user not found create");
      //   const res = await axios.post("/api/app/user/create",{
      //     userId: session?.user?.email,
      //     photo: session?.user?.image
      //     deviceId : device || deviceId
      //   })
      // }
    }
    catch(error) {
      console.log("error",error)
    }
    }

    fetchUser();
  },[status])
  
  useEffect(() => {
    const handleReSize = (e: UIEvent) => {
      if(window.innerWidth < 960){
        setScreenSize(true);
      }
    }

    window.addEventListener("resize",handleReSize);
  },[])

  const mode = useAppSelector((state) => state.theme.mode);
  const dispatch = useAppDispatch();

  const handleClick = () => {
    setAnimate(true);
    setTimeout(() => {
      dispatch(toggleTheme());
      setAnimate(false);
    }, 1000); 
  };

  const handleOnClick = () => {
    router.push("/general")
    setTimeout(() => {
      if(status && status === "authenticated"){
        router.push("/general")
      } else {
       alert("pls login first")
      }
    },1000)
  }

  return (
    <div
      className={`relative h-screen  
         overflow-hidden
        ${mode === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}
    >
      <div className="w-full max-md:flex z-9 fixed hidden backdrop-blur-xl items-center justify-between h-10">
        <div className="">
          <h1 className='bg-gradient-to-b ml-5 from-green-500 to-blue-500 font-bold bg-clip-text text-transparent text-xl'>OpenChat</h1>
        </div>
        <div className="bg-white hidden text-black h-full w-20 rounded-tl-2xl [clip-path:polygon(0_0,100%_0,100%_100%,20%_100%,0_60%)] max-md:flex items-center justify-center">
          {
            status === "loading" && (
              <div className="border-l-2 border-r-2 border-black animate-spin h-4 w-4 rounded-full"></div>
            )
          }
          {
            status === "authenticated" && (
              <div className="hidden max-md:block hover:cursor-pointer" onClick={() => setOpen(!open)}>
                <Dots theme={mode} value={open}/>
              </div>
            )
          }
          {
            status === "unauthenticated" && (
              <div className="ml-2 mb-1 hover:cursor-pointer" onClick={() => signIn("google")}>
                Sign In
              </div>
            )
          }
        </div>
      </div>
      <div className="hidden max-md:block">
        <motion.div
          initial={{ y: -200 }}
          animate={{ y: open ? -18 : -200 }}
          transition={{ duration: 0.4}}
          className='w-full h-[20vh] items-center justify-end'
        >
          <div className={`h-[80%] py-1 absolute top-16 right-0 flex flex-col gap-2 px-5 ${mode === "light" ? "bg-black text-white"  : "bg-black shadow shadow-cyan-700 text-white"} rounded-lg w-[30%]`}>
            <div className="mt-2 text-end">
             <Auth />
            </div>
            <div className="text-end">        
             <button
              disabled={animate}
              onClick={handleClick}
              className={`disabled:text-gray-500 disabled:bg-gray-300 z-10 h-9 w-9 md:h-11 md:w-11 hover:cursor-pointer rounded-full ${mode === "light" ? "bg-gray-300" : "bg-gray-700"} md:text-lg font-semibold shadow-lg`}
              >
              {mode === 'light' ? <i className="ri-moon-line"></i> : <i className="ri-sun-line"></i>}
             </button>
            </div> 
          </div>
        </motion.div>
      </div>
      <div className="absolute max-md:hidden top-3 left-0 w-full flex items-center justify-between px-8 py-3">
        <div className="font-medium group p-2 overflow-hidden relative text-2xl hover:cursor-pointer transition-all duration-150 ease-in
        after:content-[''] after:absolute after:-bottom-1 hover:after:w-full after:left-0 after:duration-300 after:transition-all after:ease-in after:w-0 after:h-2 
        after:bg-gradient-to-l after:from-blue-700 after:to-black">
          <div className="group-hover:-translate-y-20 transition-all duration-300 ease-in-out bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-300">
            OpenChat
          </div>
          <div className="absolute bottom-[-100%] group-hover:bottom-2.5 transition-all duration-300 ease-in-out bg-clip-text text-transparent bg-gradient-to-l from-green-400 to-blue-400">
            OpenChat
          </div>
        </div>
        <div className=""></div>
      </div>
     <div className="">
       <motion.div 
        initial={{ opacity: 1 }}
        animate={{ y: "-100vh" , opacity: 1 }}
        transition={{ duration: 0.5 , delay: 1}}
        className="w-full absolute flex items-center justify-center right-0 top-0 h-screen bg-black rounded">
          <motion.div
          initial={{ opacity: 1 , scale: 1}}
          animate={{ opacity: 0.5 , scale: 0.5}}
          transition={{ delay: 1.0003 }}
          className='text-4xl md:text-6xl'>
              {/* HOME */}
          </motion.div>
      </motion.div>
     </div>
      {animate && (
        <motion.span
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 100, opacity: 1 }}
          transition={{ duration: screenSize ? 2.5 : 1.3, ease: 'easeOut' }}
          className={`absolute z-9 w-10 h-10 top-22 right-5 rounded-full
            ${mode === 'light' ? 'bg-black' : 'bg-white'} transform origin-center`}
        />
      )}
      <div className="w-full md:mt-30 flex items-center justify-center">
        <div className="w-[90%] mt-4 md:w-[80%]">
          <motion.div
        initial={{ y: 100 , opacity: 0 }}
        animate={{ y: 0 , opacity: 1}}
        transition={{ duration: 0.8 }}
        >
          <h1 className='text-4xl md:text-6xl'>Drop thoughts.</h1>
        </motion.div>
        <motion.div
        initial={{ y:100 , opacity: 0}}
        animate={{ y: 0, opacity: 1}}
        transition={{ duration: 1}}
        >
          <h1 className='text-4xl mt-3 md:text-6xl'>Find vibes.</h1>
        </motion.div>
        <motion.div
        initial={{ y: 100, opacity: 0}}
        animate={{ y: 0, opacity: 1}}
        transition={{ duration: 1.1}}
        >
          <h1 className='text-4xl mt-3 md:text-6xl bg-clip-text text-transparent bg-gradient-to-b from-green-500 to-blue-900'>Connect naturally.</h1>
        </motion.div>
        </div>
      </div>
      <div className="flex h-[40vh] items-center justify-center">
        <div className="hover:cursor-pointer transition-all ease-in duration-300 hover:shadow-[5px_5px_100px_rgba(10,30,100,30)] rounded-xl text-black">
          <RunningBorderBox clicked={handleOnClick}/>
        </div>
      </div>
    </div>
  )
}

export default Page