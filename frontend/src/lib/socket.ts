import { useAppDispatch } from "@/redux/hooks"
import { setOnlineCount } from "@/redux/themeSlice";

let socket: WebSocket | null = null

export function getSocket() {

  // const dispatch = useAppDispatch();

  if (!socket || socket.readyState === WebSocket.CLOSED) {
    socket = new WebSocket('ws://localhost:9200')

    socket.onopen = () => {
      console.log('✅ Connected to WebSocket server')
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📩 Message from server:', data)
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