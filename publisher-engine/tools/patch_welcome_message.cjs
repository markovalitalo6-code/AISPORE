const fs = require("fs");
const path = require("path");

const file = path.join(process.env.HOME, "hub/AI-WorkSpace/01_projects/ai-spore/publisher-engine/src/channels/telegram/welcome.ts");
if (!fs.existsSync(file)) {
  console.error("Missing file:", file);
  process.exit(1);
}

const src = fs.readFileSync(file, "utf8");

const NEW_MSG =
`🍄 Welcome to AISPORE — Founding Players

Quick rule (Telegram limitation):
Personal info cannot be reliably shown inside the group chat.
So the group will ask you to move to the bot for your private status.

🤖 AISPORE Host Bot (PRIVATE CHAT)
1) Open: @AISporeHostBot
2) Press START
3) Use commands:

✅ Your status → /status
🔗 Your referral link → /ref
🏷️ Your badges → /status
🎟️ Your tickets → /status
🚀 Activate DMs (required once) → /start

If the bot says “Sent in private chat”:
Open @AISporeHostBot and type /start once, then /status.

Welcome in. Stay sharp. 🧬`;

const anchor = "Your personal referral link";
const idx = src.indexOf(anchor);

if (idx === -1) {
  console.error("Anchor text not found in welcome.ts. Aborting to avoid breaking the file.");
  process.exit(1);
}

const before = src.lastIndexOf("`", idx);
const after = src.indexOf("`", idx);

if (before === -1 || after === -1 || after <= before) {
  console.error("Could not locate template string bounds around anchor. Aborting.");
  process.exit(1);
}

const patched = src.slice(0, before) + "`" + NEW_MSG + "`" + src.slice(after + 1);

const bak = file + ".BAK." + new Date().toISOString().replace(/[:.]/g, "-");
fs.copyFileSync(file, bak);
fs.writeFileSync(file, patched, "utf8");

console.log("OK patched:", file);
console.log("Backup:", bak);
