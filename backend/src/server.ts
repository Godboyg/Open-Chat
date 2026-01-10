import { app } from "./app.js"
import { wss } from "./ws/websocket.js"
import http from "http"
import { connectDB } from "./lib/db.js"

connectDB()
const server = http.createServer(async (req, res) => {
  const url = new URL(
    req.url ?? "/",
    `http://${req.headers.host}`
  );

  const method = req.method ?? "GET"; // ✅ normalize

  const request = new Request(url.toString(), {
    method,
    headers: req.headers as HeadersInit,
    body:
      method === "GET" || method === "HEAD"
        ? null
        : req as unknown as BodyInit
  });

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

