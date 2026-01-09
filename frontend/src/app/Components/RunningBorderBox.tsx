import { h1, span } from "motion/react-client";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import React, { useState } from "react";

type props = {
  clicked: (value: boolean) => void
}

const RunningBorderBox = ({ clicked } : props) => {

  const {data: session, status} = useSession();

  const [click , setClick] = useState(false)

  return (
    <div className="box h-15 w-38 relative"
    onClick={() => {
      clicked(true)
        setClick(true)
      // if(status === "authenticated"){
      //   clicked(true)
      //   setClick(true)
      //   setTimeout(() => {
      //     setClick(false)
      //   },2000)
      // } 
      // else {
      //   setClick(true)
      //   clicked(true)
      //   signIn("google")
      // }
    }}>
      {
        click ? (
          <div className="hover:cursor-pointer text-sm bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 
          text-transparent">Loading....</div>
        ) : (
          <h1 className="hover:cursor-pointer text-sm text-transparent 
          bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">Get Started!</h1>
        )
      }
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
};

export default RunningBorderBox;