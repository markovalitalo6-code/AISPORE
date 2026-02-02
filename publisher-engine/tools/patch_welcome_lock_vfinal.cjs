const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "src/channels/telegram/welcome.ts");
if (!fs.existsSync(file)) {
  console.error("Missing:", file);
  process.exit(1);
}

const src = fs.readFileSync(file, "utf8");
const start = src.indexOf("const welcomeText");
if (start === -1) {
  console.error("welcomeText not found in welcome.ts");
  process.exit(1);
}

const bt1 = src.indexOf("`", start);
const bt2 = src.indexOf("`", bt1 + 1);
if (bt1 === -1 || bt2 === -1) {
  console.error("Template literal for welcomeText not found");
  process.exit(1);
}

// LOCKED welcome message (vFinal)
const locked = `🍄 AISPORE — Founding Players

⚠️ READ THIS (Telegram limitation)
Personal status (referrals, tickets, badges) cannot be shown reliably in the GROUP chat.
So AISPORE uses a PRIVATE Host Bot for all personal info.

✅ WHAT YOU MUST DO (1 minute)
1) Open the bot: @AISporeHostBot
2) Press START (required once)
3) Write commands INSIDE THE BOT CHAT (NOT in this group)

🤖 Commands (in @AISporeHostBot private chat)
✅ /status  — your status card (referrals, tickets, badges)
🔗 /ref     — your personal referral link
🏆 /leaders — top referrers

If the group says: “Sent your info in a private chat”
→ Open @AISporeHostBot → type /start once → then /status

Welcome in. Stay sharp. 🧬`.trim();

// replace only the template literal content
const out = src.slice(0, bt1 + 1) + locked + src.slice(bt2);

const bak = file + ".BAK." + new Date().toISOString().replace(/[:.]/g, "-");
fs.copyFileSync(file, bak);
fs.writeFileSync(file, out, "utf8");

console.log("OK welcome LOCKED:", file);
console.log("Backup:", bak);
