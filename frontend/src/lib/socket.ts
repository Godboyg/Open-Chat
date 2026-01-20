
import { getSession } from "next-auth/react";
import { subscribeToPush } from "./push";

let socket: WebSocket | null = null;
let listeners: ((data: any) => void)[] = []

export function getSocket(): WebSocket {
  if (
    !socket ||
    socket.readyState === WebSocket.CLOSED ||
    socket.readyState === WebSocket.CLOSING
  ) {
    socket = new WebSocket("ws://localhost:9200");
    // socket = new WebSocket("wss://open-chat-v9i4.onrender.com/ws");

    socket.onopen = async () => {
      try {
        console.log("✅ Connected to WebSocket server");

        const session = await getSession();

        const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        let subscription: PushSubscription | undefined;

        if (key) {
          subscription = await subscribeToPush(key);
        }

        emit({
          type: "user-online",
          session,
          subscription
        });
      } catch (error) {
        console.error("❌ WebSocket auth error", error);
        emit({ type: "push-error" , error})
      }
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 Message from server:", data);

      listeners.forEach((cb) => cb(data));
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

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(event));
  } else {
    ws.addEventListener(
      "open",
      () => ws.send(JSON.stringify(event)),
      { once: true }
    );
  }
}
