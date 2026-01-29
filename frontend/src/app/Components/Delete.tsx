import React, { useEffect, useState } from 'react'
import { emit } from '@/lib/socket'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast';

interface props {
  del: any;
  close: () => void;
}

function Delete({ del , close }: props) {

  const [loading , setLoading] = useState(false)

  const handleDelete = () => {
    try{
      setLoading(true);
      emit({ type: "delete-msg" , del });
    } catch(error) {
      console.log("Error",error);
      toast.error("try again!!");
    }
  }

  return (
     <div className="absolute z-99 p-5 flex items-center justify-center top-0 left-0 h-screen w-full bg-black/50">
        <motion.div
         initial={{ opacity: 0 , y: 200 }}
         animate={{ opacity: 1 , y: 0 }}
         transition={{
           duration: 0.4,
           stiffness: 400
         }}
         exit={{
           y: 100,
           opacity: 0,
           transition: { duration: 0.8 , ease: "easeInOut"}
         }}
         className='w-full'
         >
          <div className="w-full bg-black/50 p-3 rounded-xl">
            <div className="text-center">
              Are u sure u want to delete {del.text} msg
            </div>
            <div className="flex flex-col gap-2 w-full mt-3">
              <div className="w-full flex items-center justify-center">
                <button className='py-3 px-5 rounded-xl bg-gray-600 font-bold'
                onClick={handleDelete}>
                  {
                    loading ? 
                    <div className="h-3 w-3 border border-t-red-500 rounded-full animate-spin"></div>
                    : "Delete"
                  }
                </button>
              </div>
              <div className="w-full flex items-center justify-center">
                <button
                onClick={close}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </motion.div>
     </div>
  )
}

export default Delete