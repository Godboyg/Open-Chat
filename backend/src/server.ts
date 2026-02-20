// import { app } from "./app.js"
// import { wss } from "./ws/websocket.js"
// import http from "http"
// import { connectDB } from "./lib/db.js"
// import { staticPlugin } from '@elysiajs/static'

// app.use(
//   staticPlugin({
//     assets: "./uploads",
//     prefix: "/uploads",
//   })
// );

// connectDB()

// type NodeRequestInit = RequestInit & {
//   duplex?: "half";
// };

// const server = http.createServer(async (req, res) => {
//   const url = new URL(
//     req.url ?? "/",
//     `http://${req.headers.host}`
//   );

//   const method = req.method ?? "GET"; // ✅ normalize

//   const requestInit: NodeRequestInit = {
//     method,
//     headers: req.headers as HeadersInit,
//     body:
//       method === "GET" || method === "HEAD"
//         ? null
//         : (req as unknown as BodyInit),
//     duplex: "half" 
//   };

//   const request = new Request(url.toString(), requestInit);

//   const response = await app.fetch(request);

//   res.writeHead(response.status, Object.fromEntries(response.headers));
//   res.end(Buffer.from(await response.arrayBuffer()));
// });

// server.on("upgrade", (req, socket, head) => {
//   if (req.url === "/ws") {
//     wss.handleUpgrade(req, socket, head, (ws) => {
//       wss.emit("connection", ws, req);
//     });
//   } else {
//     socket.destroy();
//   }
// });

// server.listen(9100, () => {
//   console.log("HTTP → http://localhost:9100");
//   console.log("WS   → ws://localhost:9100/ws");
// });





import { app } from './app.js'
import { wss } from "./ws/websocket.js"
import { createServer } from 'http'
import WebSocket, { WebSocketServer } from 'ws'
import { connectDB } from './lib/db.js';
import { staticPlugin } from '@elysiajs/static'

app.use(
  staticPlugin({
    assets: "./uploads",
    prefix: "/uploads",
  })
);

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