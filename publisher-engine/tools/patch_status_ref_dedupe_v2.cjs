const fs = require("fs");

const file = process.argv[2];
if (!file) {
  console.error("Usage: node tools/patch_status_ref_dedupe_v2.cjs <path-to-handler.ts>");
  process.exit(1);
}

let src = fs.readFileSync(file, "utf8");
const bak = file + ".BAK." + new Date().toISOString().replace(/[:.]/g, "-");
fs.copyFileSync(file, bak);

// 1) Inject renderStatusCardV2() once
const MARK = "AISPORE_STATUS_CARD_V2";
if (!src.includes(MARK)) {
  const helper = `
/* ${MARK}
 * Status Card v2 (DM): single deterministic render used by /ref and /status.
 */
function renderStatusCardV2(rec: any) {
  const refCode = String(rec?.refCode ?? "");
  const invites = typeof rec?.invites === "number" ? rec.invites : 0;
  const referralBadge = String(rec?.badgeLevel ?? "Bronze");
  const tickets = Math.max(1, 1 + invites);

  const link = refCode
    ? \`https://t.me/AISporeFoundingPlayers?start=\${refCode}\`
    : "Open /ref after /start to generate your link.";

  return \`🍄 AISPORE STATUS

🏷️ Referral Badge: \${referralBadge}
🎟️ Tickets (pre-launch): \${tickets}
👥 Invites: \${invites}

🔗 Your Referral Link:
\${link}

⏳ Hold Badge:
Pre-launch (activates at token + snapshot)

🧬 AISPORE\`.trim();
}
`;
  // insert after imports (best-effort): after last import line
  const lines = src.split("\n");
  let insertAt = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*import\s+/.test(lines[i])) insertAt = i + 1;
  }
  lines.splice(insertAt, 0, helper.trimEnd(), "");
  src = lines.join("\n");
}

// 2) Replace old inline template cards (RefCode...Hold-based badges...) with renderStatusCardV2(rec)
// Match: const text = ` ... RefCode: ... Hold-based badges activate ... `.trim();
const re = /const\s+text\s*=\s*`[\s\S]*?RefCode:[\s\S]*?Hold-based badges activate[\s\S]*?`\s*\.trim\(\)\s*;/g;

let count = 0;
src = src.replace(re, (m) => {
  count += 1;
  return 'const text = renderStatusCardV2(rec);';
});

// If the note text changed slightly, also catch "Hold-based badges" without "activate"
const re2 = /const\s+text\s*=\s*`[\s\S]*?RefCode:[\s\S]*?Hold-based badges[\s\S]*?`\s*\.trim\(\)\s*;/g;
src = src.replace(re2, (m) => {
  count += 1;
  return 'const text = renderStatusCardV2(rec);';
});

fs.writeFileSync(file, src, "utf8");

console.log("OK patched:", file);
console.log("Backup:", bak);
console.log("Replaced inline cards:", count);
