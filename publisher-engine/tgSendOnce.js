const https = require("https");
require("dotenv").config();

console.log("\n=== AISPORE TG SEND TEST ===\n");

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !chatId) {
  console.error("❌ TELEGRAM_BOT_TOKEN tai TELEGRAM_CHAT_ID puuttuu .env-tiedostosta");
  process.exit(1);
}

const message = "AISPORE TG test: if you see this in the group, the engine can talk. 🍄🚀";

const data = JSON.stringify({
  chat_id: chatId,
  text: message,
});

const options = {
  hostname: "api.telegram.org",
  path: `/bot${token}/sendMessage`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  },
};

const req = https.request(options, (res) => {
  let body = "";
  res.on("data", (chunk) => (body += chunk));
  res.on("end", () => {
    console.log("Status code:", res.statusCode);
    console.log("Response body:", body);
    console.log("\n=== TG SEND TEST DONE ===\n");
  });
});

req.on("error", (err) => {
  console.error("Request error:", err);
});

req.write(data);
req.end();

