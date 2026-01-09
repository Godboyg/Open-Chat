import React from 'react'

function Typing() {
  return (
    <div className='flex items-center justify-around w-12 h-6 p-2'>
      <span className='h-2 w-2 rounded-full bg-green-900 animate-bounce [animation-delay:0s]'></span>
      <span className='h-2 w-2 rounded-full bg-blue-300 animate-bounce [animation-delay:0.2s]'></span>
      <span className='h-2 w-2 rounded-full bg-cyan-900 animate-bounce [animate-delay:0.4s]'></span>
    </div>
  )
}

export default Typing