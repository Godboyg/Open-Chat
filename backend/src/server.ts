import { app } from './app.js'
import { wss } from "./ws/websocket.js"
import { createServer } from 'http'
import WebSocket, { WebSocketServer } from 'ws'
import { connectDB } from './lib/db.js';

connectDB();

const server = createServer();

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
    wss.emit('connection', ws, request)
  })
})

app.listen({ server, port: 9100 })

server.listen(9200, () => {
  console.log('🚀 Elysia + WebSocket server running at http://localhost:9000')
})