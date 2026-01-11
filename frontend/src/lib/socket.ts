let socket: WebSocket | null = null

export function getSocket() {

  if (!socket || socket.readyState === WebSocket.CLOSED) {
    socket = new WebSocket('wss://open-chat-v9i4.onrender.com/ws')

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

export const getScoket = () => socket;
