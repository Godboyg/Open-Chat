import React from 'react'
import { signIn , signOut , useSession } from 'next-auth/react'
import axios from 'axios';

function Auth() {

    const { data: session , status} = useSession();

    const handleSignOut = async() => {
      try{
        const internalId = session?.user.internalId;

        const res = await axios.delete("/api/app/user/delete",{
          data : {
            internalId
          }
        })

        console.log("response", res.data);

        await signOut();
      } catch(error) {
        console.log("error",error);
      }
    }

  return (
    <div>
      <div className="hover:cursor-pointer">
         {
        status === "loading" && (
          <div className="">
            Loding....
          </div>
        )
      }
      {
        status === "unauthenticated" && (
          <div className="" onClick={() => signIn("github")}>
            Sign In
          </div>
        )
      }
      {
        status === "authenticated" && (
          <div className="" onClick={handleSignOut}> 
            Logout
          </div>
        )
      }
      </div>
    </div>
  )
}

export default Auth
