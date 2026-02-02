const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "src/channels/telegram/handler.ts");
if (!fs.existsSync(file)) {
  console.error("Missing file:", file);
  process.exit(1);
}

const src = fs.readFileSync(file, "utf8");
const re = /Invites:\s*\$\{rec\.invites\}/g;

const repl =
  "Invites: ${rec.invites}\n" +
  "Referral badge: ${rec.badgeLevel}\n" +
  "Hold badge: Pre-launch (Pending)\n" +
  "Tickets (pre-launch): ${1 + (rec.invites || 0)}\n\n" +
  "Note: Hold-based badges activate when AISPORE token + snapshot go live.";

if (!re.test(src)) {
  console.error("Pattern not found in handler.ts (Invites: ${rec.invites}). No changes made.");
  process.exit(2);
}

const out = src.replace(re, repl);

const bak = file + ".BAK." + new Date().toISOString().replace(/[:.]/g, "-");
fs.copyFileSync(file, bak);
fs.writeFileSync(file, out, "utf8");

console.log("OK patched:", file);
console.log("Backup:", bak);
