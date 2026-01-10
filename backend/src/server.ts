import { app } from "./app.js"
import { wss } from "./ws/websocket.js"
import http from "http"
import { connectDB } from "./lib/db.js"

connectDB()
const server = http.createServer(async (req, res) => {
  const request = new Request(
    `http://${req.headers.host}${req.url}`,
    {
      method: req.method,
      headers: req.headers as any,
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : req
    }
  );

  const response = await app.fetch(request);

  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
});

server.on("upgrade", (req, socket, head) => {
  if (req.url === "/ws") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

server.listen(9100, () => {
  console.log("HTTP → http://localhost:9100");
  console.log("WS   → ws://localhost:9100/ws");
});

