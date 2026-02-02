import http from "http";
import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const base = path.join(projectRoot, "src", "web", "snake");

const port = process.env.SNAKE_PORT ? Number(process.env.SNAKE_PORT) : 5179;

function contentType(fp) {
  if (fp.endsWith(".html")) return "text/html; charset=utf-8";
  if (fp.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (fp.endsWith(".css")) return "text/css; charset=utf-8";
  if (fp.endsWith(".png")) return "image/png";
  if (fp.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url || "/", "http://localhost");
  let u = parsed.pathname;

  if (u === "/" || u === "/snake") u = "/index.html";

  const fp = path.join(base, u);
  if (!fp.startsWith(base)) {
    res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    res.end("forbidden");
    return;
  }

  fs.readFile(fp, (err, data) => {
    if (err) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": contentType(fp) });
    res.end(data);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`✅ Snake stub running: http://127.0.0.1:${port}/snake`);
  console.log("Leave this terminal running. Ctrl+C stops the server.");
});
