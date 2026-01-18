import { getSession } from "next-auth/react"
import { subscribeToPush } from "./push"

let socket: WebSocket | null = null
let listeners: ((data: any) => void)[] = []

export function getSocket() {

  if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
    socket = new WebSocket('wss://open-chat-v9i4.onrender.com/ws')

    socket.onopen = async() => {      
      try{
        console.log('✅ Connected to WebSocket server')
      const session = await getSession();
      // if(!session) {
      //   console.warn("⚠️ No session found")
      //   return
      // }
      console.log("notif",Notification.permission);
      if(socket) {
        const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        let subscription;
        if(key) {
          console.log("key",key);
          subscription = await subscribeToPush(key);
          console.log("subs",subscription);
        }
        console.log("subs",subscription);
        socket.send(JSON.stringify({ type:"user-online", session , subscription }));
      } 
      } catch(error) {
        console.log("socket not connected", error);
      }
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📩 Message from server:', data)
      listeners.forEach((cb) => cb(data))
    }

    socket.onclose = () => {
      console.log('❌ WebSocket closed')
    }

    socket.onerror = (err) => {
      console.error('⚠️ WebSocket error:', err)
    }
  }

  return socket;
}

export function subscribe(cb: (data: any) => void) {
  listeners.push(cb)

  return () => {
    listeners = listeners.filter((x) => x !== cb)
  }
}

export function emit(event: any) {
  const socket = getSocket()

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(event))
  } else {
    socket.addEventListener(
      'open',
      () => socket.send(JSON.stringify(event)),
      { once: true }
    )
  }
}
