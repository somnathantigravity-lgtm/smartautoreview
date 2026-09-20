const http = require("http");
const net = require("net");

const TARGET_PORT = 3000;

function createProxy(listenPort) {
  const server = http.createServer((req, res) => {
    const options = {
      hostname: "127.0.0.1",
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `localhost:${listenPort}`,
        "x-forwarded-port": `${listenPort}`,
        "x-forwarded-host": `localhost:${listenPort}`
      }
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on("error", (err) => {
      res.writeHead(502, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`
        <div style="font-family:sans-serif;padding:40px;text-align:center;">
          <h2>Portal Proxy Connecting to Next.js...</h2>
          <p>Please ensure Next.js is running on port ${TARGET_PORT}. (${err.message})</p>
        </div>
      `);
    });

    req.pipe(proxyReq, { end: true });
  });

  // Handle WebSocket / HMR upgrade
  server.on("upgrade", (req, socket, head) => {
    const targetSocket = net.connect(TARGET_PORT, "127.0.0.1", () => {
      let rawHeader = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
      for (const [k, v] of Object.entries(req.headers)) {
        rawHeader += `${k}: ${v}\r\n`;
      }
      rawHeader += "\r\n";
      targetSocket.write(rawHeader);
      if (head && head.length) targetSocket.write(head);
      targetSocket.pipe(socket);
      socket.pipe(targetSocket);
    });

    targetSocket.on("error", () => socket.destroy());
    socket.on("error", () => targetSocket.destroy());
  });

  server.listen(listenPort, "0.0.0.0", () => {
    console.log(`[Portal Router] Port ${listenPort} listening -> forwarded to ${TARGET_PORT}`);
  });

  return server;
}

createProxy(3001);
createProxy(3002);
