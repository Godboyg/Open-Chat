import { app } from "./app.js"
import { wss } from "./ws/websocket.js"
import { createServer } from "http"
import { connectDB } from "./lib/db.js"

connectDB()

// 1️⃣ Create ONE HTTP server
const server = createServer(app.handle)

// 2️⃣ Handle WebSocket upgrade ON THE SAME SERVER
server.on("upgrade", (request, socket, head) => {
  const { pathname } = new URL(
    request.url!,
    `http://${request.headers.host}`
  )

  if (pathname === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request)
    })
  } else {
    socket.destroy()
  }
})

// 3️⃣ Start server (ONE PORT ONLY)
const PORT = process.env.PORT || 9100

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
