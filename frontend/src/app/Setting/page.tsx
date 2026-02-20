"use client"
import { useAppSelector } from '@/redux/hooks';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import React, { useRef, useState , useEffect} from "react";
import 'remixicon/fonts/remixicon.css'
import { motion , AnimatePresence, easeIn } from 'motion/react';
import { useRouter } from 'next/navigation';

function page() {

    const { mode } = useAppSelector((state) => state.theme);
    const { data: session , status , update } = useSession();
    const [name , setName] = useState<string>("");
    const [ open , setOpen ] = useState<boolean>(false);
    const [user , setUser] = useState({
        name: "",
        image: ""
    })
    const router = useRouter();

    useEffect(() => {
        if(status !== 'authenticated') return;

        const currentUser = async() => {
            const res = await axios.get("/api/app/user/current", {
                params: {
                    uniqueUserId: session?.user.internalId
                }
            })

            console.log("res",res);
            setPreview(res.data.current.image);
            setName(res.data.current.fullName);
            setUser({
              name: res.data.current.name,
              image: res.data.current.image
            })
        }

        currentUser();
    },[status])

    const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null | undefined>(
    session?.user?.image || null
  );
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if(!session) return;
    setPreview(session?.user?.image);
  },[session])

  const uploadFile = async (file: File) => {
    setLoading(true);

    // Local preview instantly
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    const userid = session?.user.internalId;

    const formData = new FormData();
    formData.append("profileImage", file);
    formData.append("userId", userid ? userid : "");

    const res = await fetch("/api/app/user/upload-profile", {
      method: "POST",
      body: formData,
    });

    console.log("res",res);

    const data = await res.json();
    console.log("res",data.session?.user.image);
    console.log(data.success)

    if (data.success) {
      await update({ image: data.profileImage });
      setPreview(data.profileImage);
    }

    setLoading(false);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.[0]) return;
    uploadFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleEdit = async() => {
    setLoading(true);
    const res = await axios.put("/api/app/user/update-name", {
      userId: session?.user.internalId,
      name: name
    })

    console.log("res",res);
    if(res.data.success === true) {
      setLoading(false);
      setOpen(false);
      setUser({
        name: res.data.data.fullName,
        image: res.data.data.image
      })
    }
  }

  return (
    <div className={`h-screen w-full relative flex items-center justify-center ${mode ? "bg-black text-white" : "bg-white text-black"}`}>
      <motion.div 
      initial={false}
      animate={{
        y: open ? "20%" : "100%",
        opacity: open ? 1 : 0,
        zIndex: open ? 10 : 0,
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className={`flex absolute top-0 left-0 w-full flex-col items-center justify-center gap-4 ${open ? "block" : "hidden"}`}>
        <div className="absolute top-0 hover:cursor-pointer right-5"
        onClick={() => setOpen(false)}>
          <i className="ri-close-line"></i>
        </div>
      <div
        className={`relative w-40 h-40 rounded-full overflow-hidden cursor-pointer group border-2 
          ${dragActive ? "border-blue-500" : "border-gray-300"}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <img
            src={preview ? 
              preview : ""
            }
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500">
            No Image
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 
          flex items-center justify-center text-white font-medium transition">
          {loading ? "Uploading..." : "Change"}
        </div>
      </div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-2">
        <div className="">
          Change Name
        </div>
        <div className="px-4">
          <input type="text" placeholder='Name' value={name} onChange={(e) => setName(e.target.value)} className='w-full p-2 rounded-xl border-none outline-none' />
        </div>
        <div className="relative">
          <button 
            disabled={name.length <= 0}
            className="py-2 disabled:bg-gray-500 hover:cursor-pointer px-6 rounded-xl bg-blue-500 text-white"
            onClick={handleEdit}>
              Edit
          </button>
          {
            loading && <div className="absolute z-50 inset-0 flex items-center justify-center bg-black/50">
                  <span className='h-3 w-3 rounded-full border-t-cyan-500 border-1 border-black animate-spin'></span>
          </div>
          }
        </div>
      </div>
      </motion.div>
      <div className="w-full flex flex-col p-2 gap-8 h-full lg:w-[65%]">
        <div className="flex items-center gap-2">
           <i className="ri-arrow-left-line hover:cursor-pointer"
                onClick={() => router.push("/General")}></i>
            <h2 className='font-bold text-xl'>Setting</h2>
        </div>
        <div className="flex flex-col gap-1">
            <div className="w-full flex items-center justify-center">
                <div className="relative">
                    {
                        user.image ? (
                            <div className="">
                              <Image
                                 alt="user"
                                 src={
                                    user.image
                                      ? user.image
                                      : ""
                                  }
                                 height={95}
                                 width={95}
                                 priority
                                 className="rounded-full h-14 w-14 object-cover"
                               />
                            </div> 
                        ) : (
                            <div className="rounded-full border-t-gray-400 border-2 h-10 w-10 animate-spin border-black"></div>
                        )
                    }
                    <div className="absolute flex bg-black p-2.5 hover:cursor-pointer rounded-full items-center justify-center bottom-0 right-0 h-4 w-4"
                    onClick={() => setOpen(true)}>
                      <i className="ri-pencil-fill text-sm"></i>
                    </div>
                </div>
            </div>
            <div className="w-full text-center">
                <span className='text-gray-300 text-xl'>{user.name}</span>
            </div>
        </div>
      </div>
    </div>
  )
}

export default page