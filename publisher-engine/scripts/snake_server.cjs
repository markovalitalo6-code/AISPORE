const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

try {
  require("dotenv").config({ path: path.join(process.cwd(), ".env") });
} catch (_) {}

const Database = require("better-sqlite3");
const dbPath = path.join(process.cwd(), "aispore_v1.sqlite");
const db = new Database(dbPath);

function isoWeekUTC(d) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function ensureSnakeTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS snake_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegramId INTEGER NOT NULL,
      username TEXT,
      score INTEGER NOT NULL,
      weekNumber INTEGER NOT NULL,
      runId TEXT,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_snake_scores_week ON snake_scores(weekNumber);
    CREATE INDEX IF NOT EXISTS idx_snake_scores_user_week ON snake_scores(telegramId, weekNumber);
  `);
}

function snakeSig(tgId, ts) {
  const secret = String(process.env.SNAKE_SECRET || "");
  const msg = String(tgId) + ":" + JSON.stringify(ts);
  return crypto.createHmac("sha256", secret).update(msg).digest("hex");
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(data && data.length ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function contentType(fp) {
  if (fp.endsWith(".html")) return "text/html; charset=utf-8";
  if (fp.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (fp.endsWith(".css")) return "text/css; charset=utf-8";
  if (fp.endsWith(".json")) return "application/json; charset=utf-8";
  if (fp.endsWith(".png")) return "image/png";
  if (fp.endsWith(".jpg") || fp.endsWith(".jpeg")) return "image/jpeg";
  if (fp.endsWith(".svg")) return "image/svg+xml; charset=utf-8";
  return "application/octet-stream";
}

function getLanIP() {
  const n = os.networkInterfaces();
  for (const k of Object.keys(n)) {
    for (const i of n[k] || []) {
      if (i && i.family === "IPv4" && !i.internal) return i.address;
    }
  }
  return "127.0.0.1";
}

const base = path.join(process.cwd(), "src", "web", "snake");
const port = Number(process.env.SNAKE_PORT || 5179);

const server = http.createServer(async (req, res) => {
  try {
    const urlObj = new URL(req.url || "/", "http://localhost");
    const pathname = urlObj.pathname;

    // API: submit score
    if (pathname === "/api/snake/score" && req.method === "POST") {
      const body = await readJsonBody(req);
      const telegramId = Number(body.telegramId || 0);
      const ts = Number(body.ts || 0);
      const sig = String(body.sig || "");
      const username = body.username ? String(body.username) : null;
      const score = Number(body.score || 0);

      if (!telegramId || !ts || !sig || !Number.isFinite(score)) {
        res.writeHead(400, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: false, error: "bad_request" }));
        return;
      }

      const now = Date.now();
      const driftMs = Math.abs(now - ts);
      if (driftMs > 10 * 60 * 1000) {
        res.writeHead(401, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: false, error: "ts_out_of_range" }));
        return;
      }

      const expected = snakeSig(telegramId, ts);
      if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
        res.writeHead(401, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: false, error: "bad_sig" }));
        return;
      }

      ensureSnakeTable();
      const weekNumber = isoWeekUTC(new Date());
      db.prepare(
        "INSERT INTO snake_scores (telegramId, username, score, weekNumber, runId, createdAt) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(telegramId, username, score, weekNumber, null, new Date().toISOString());

      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: true, weekNumber }));
      return;
    }

    // Static snake files
    let u = pathname;
    if (u === "/" || u === "/snake") u = "/index.html";
    const fp = path.join(base, u);

    if (!fp.startsWith(base)) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }

    fs.readFile(fp, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      res.writeHead(200, { "content-type": contentType(fp) });
      res.end(data);
    });
  } catch (e) {
    res.writeHead(500);
    res.end("server error");
  }
});

server.listen(port, "0.0.0.0", () => {
  const ip = getLanIP();
  console.log("✅ Snake server running:");
  console.log("   Local: http://127.0.0.1:" + port + "/snake");
  console.log("   LAN  : http://" + ip + ":" + port + "/snake");
  console.log("✅ API ready: POST /api/snake/score");
});
