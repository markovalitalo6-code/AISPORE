require("dotenv").config();
const https = require("https");
const querystring = require("querystring");

console.log("\n=== TG TEST SEND ===\n");
console.log("Chat ID:", process.env.TELEGRAM_CHAT_ID);

const postData = querystring.stringify({
  chat_id: process.env.TELEGRAM_CHAT_ID,
  text: "AISPORE TG test – if you see this, OJ has a direct line ✅",
});

const options = {
  hostname: "api.telegram.org",
  path: `/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "Content-Length": Buffer.byteLength(postData),
  },
};

const req = https.request(options, (res) => {
  let body = "";
  res.on("data", (chunk) => (body += chunk));
  res.on("end", () => {
    console.log("TG response:", body);
  });
});

req.on("error", (err) => {
  console.error("TG ERROR:", err);
});

req.write(postData);
req.end();

