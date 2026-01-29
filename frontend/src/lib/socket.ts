
import { getSession } from "next-auth/react";
import { subscribeToPush } from "./push";
import { ErrorIcon } from "react-hot-toast";

let socket: WebSocket | null = null;
let queue: any[] = [];
let listeners: ((data: any) => void)[] = []
let openListenerAttached = false;
const queuedEventTypes = new Set<string>();

export function getSocket(): WebSocket {
  if (
    !socket ||
    socket.readyState === WebSocket.CLOSED ||
    socket.readyState === WebSocket.CLOSING
  ) {
    socket = new WebSocket("ws://localhost:9200");
    // socket = new WebSocket("wss://open-chat-v9i4.onrender.com/ws");

    // socket.onopen = async () => {
    //   try {
    //     console.log("✅ Connected to WebSocket server");

    //     const session = await getSession();

    //     const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    //     let subscription: PushSubscription | null = null;

    //     if (key) {
    //       subscription = await subscribeToPush(key);
    //     }

    //     emit({
    //       type: "user-online",
    //       session,
    //       subscription
    //     });
    //   } catch (error) {
    //     console.error("❌ WebSocket auth error", error);
    //     emit({ type: "push-error" , error})
    //   }
    // };

    socket.onopen = async () => {
  console.log("✅ Connected to WebSocket server");

  let session = null;
  let subscription: PushSubscription | null = null;

  try {
    session = await getSession();
  } catch (err) {
    console.error("❌ Failed to get session", err);
  }

  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (key && "serviceWorker" in navigator && "PushManager" in window) {
    try {
      subscription = await subscribeToPush(key);
    } catch (err) {
      // 🔕 Push is optional – Brave often fails here
      console.warn("⚠️ Push subscription failed (continuing without push)", err);
    }
  } else {
    console.warn("⚠️ Push not supported or VAPID key missing");
  }

  // 🚀 ALWAYS emit user-online
  emit({
    type: "user-online",
    session,
    subscription, // null if unavailable
  });
};

    socket.onmessage = (event: any) => {
      if (typeof event.data !== "string" || event.data.trim() === "") {
       return;
      }
      try{
        const data = JSON.parse(event.data);
        console.log("📩 Message from server:", data);

        listeners.forEach((cb) => cb(data));
      } catch(error) {
        console.warn("Invalid WS message:",error);
      }
    };

    socket.onclose = () => {
      console.log("❌ WebSocket closed");
    };

    socket.onerror = (err) => {
      console.error("⚠️ WebSocket error:", err);
    };
  }

  return socket;
}


export function subscribe(cb: any) {
  listeners.push(cb);

  return () => {
    listeners = listeners.filter((x) => x !== cb);
  };
}

export function emit(event: any): void {
  const ws = getSocket();
  const payload = JSON.stringify(event);

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(payload);
    return;
  } 

  if (!queuedEventTypes.has(event.type)) {
    queuedEventTypes.add(event.type);
    queue.push(payload);
  }

  if(!openListenerAttached) {
    openListenerAttached = true;

    ws.addEventListener("open", () => {
      queue.forEach((msg) => ws.send(msg));
      queue = [];
      queuedEventTypes.clear();
    });
  }
}
