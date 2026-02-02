const fs = require("fs");

const file = process.argv[2] || "src/channels/telegram/handler.ts";
if (!fs.existsSync(file)) {
  console.error("Missing file:", file);
  process.exit(1);
}

const src = fs.readFileSync(file, "utf8");

const needle = "Invites: ${rec.invites}";
if (!src.includes(needle)) {
  console.error("Pattern not found in handler.ts. Expected:", needle);
  process.exit(1);
}

const inject =
`Invites: \${rec.invites}
Referral badge: \${rec.badgeLevel}
Hold badge: Pre-launch (Pending)
Tickets (pre-launch): \${(1 + (rec.invites || 0))}
`;

const out = src.replaceAll(needle, inject.trimEnd());

const bak = file + ".BAK." + new Date().toISOString().replace(/[:.]/g, "-");
fs.copyFileSync(file, bak);
fs.writeFileSync(file, out, "utf8");

console.log("OK patched:", file);
console.log("Backup:", bak);
