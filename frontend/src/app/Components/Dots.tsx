import React from 'react'

type props = {
    theme: string,
    value?: boolean
}

function Dots({ theme , value }: props) {
  return (
    <div className='flex flex-col gap-[3.5px]'>
        <span className={`transition-all duration-400 ease-in-out
           ${value ? "w-5" : "w-7"} h-[1.3px] rounded-md bg-gradient-to-l from-black to-blue-300`}></span>
        <span className={`transition-all duration-400 ease-initial 
          ${value ? "w-7" : "w-5"} h-[1.3px] rounded-md bg-gradient-to-r from-black to-blue-300`}></span>
    </div>
  )
}

export default Dots