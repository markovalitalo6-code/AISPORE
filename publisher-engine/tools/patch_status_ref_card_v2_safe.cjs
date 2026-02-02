const fs = require("fs");

const file = process.argv[2];
if (!file) {
  console.error("Usage: node tools/patch_status_ref_card_v2_safe.cjs <handler.ts>");
  process.exit(1);
}

let src = fs.readFileSync(file, "utf8");
const bak = file + ".BAK." + new Date().toISOString().replace(/[:.]/g, "-");
fs.copyFileSync(file, bak);

// ---- 1) insert helper AFTER all imports (robust: consume import statements until ';') ----
const MARK = "AISPORE_STATUS_CARD_V2";
if (!src.includes(MARK)) {
  const helper =
`/* ${MARK}
 * Status Card v2 (DM): single deterministic render used by /ref and /status.
 */
function renderStatusCardV2(rec: any) {
  const refCode = String(rec?.refCode ?? "");
  const invites = typeof rec?.invites === "number" ? rec.invites : 0;
  const referralBadge = String(rec?.badgeLevel ?? "Bronze");
  const tickets = Math.max(1, 1 + invites);

  const link = refCode
    ? \`https://t.me/AISporeFoundingPlayers?start=\${refCode}\`
    : "Open @AISporeHostBot and type /start once, then /ref.";

  return \`🍄 AISPORE STATUS

🏷️ Referral Badge: \${referralBadge}
👥 Invites: \${invites}
🎟️ Tickets (pre-launch): \${tickets}

🔗 Your Referral Link:
\${link}

⏳ Hold Badge:
Pre-launch (activates at token + snapshot)

🧬 AISPORE\`.trim();
}
`;

  // find end of import region: from top, repeatedly skip "import ... ;" (multi-line safe)
  let i = 0;
  const n = src.length;

  function skipWS() {
    while (i < n && (src[i] === " " || src[i] === "\t" || src[i] === "\n" || src[i] === "\r")) i++;
  }

  skipWS();
  while (src.slice(i, i + 6) === "import") {
    const semi = src.indexOf(";", i);
    if (semi === -1) break;
    i = semi + 1;
    skipWS();
  }

  src = src.slice(0, i) + "\n\n" + helper + "\n" + src.slice(i);
}

// ---- 2) force /ref and /status to use the same card (no duplication) ----
function patchCommand(cmd) {
  const a = src.indexOf(`bot.command("${cmd}"`);
  const b = src.indexOf(`bot.command('${cmd}'`);
  let start = a !== -1 ? a : b;
  if (start === -1) return { ok: false, reason: "command not found" };

  // command block ends before next bot.command( or EOF
  let next = src.indexOf("bot.command(", start + 12);
  if (next === -1) next = src.length;

  const block = src.slice(start, next);

  // ensure we have rec; if not, still safe: we only change text assignment patterns
  let patched = block;

  // Replace any inline template that includes RefCode/Invites/Hold badge etc with renderStatusCardV2(rec)
  patched = patched.replace(
    /const\s+text\s*=\s*`[\s\S]*?`\s*\.trim\(\)\s*;/g,
    "const text = renderStatusCardV2(rec);"
  );

  patched = patched.replace(
    /const\s+text\s*=\s*`[\s\S]*?RefCode:[\s\S]*?`[\s\S]*?;/g,
    "const text = renderStatusCardV2(rec);"
  );

  // If they build text via concatenation, catch common patterns:
  patched = patched.replace(
    /const\s+text\s*=\s*["'`][\s\S]*?(RefCode:|Invites:|Hold badge:|Referral badge:)[\s\S]*?;\s*/g,
    "const text = renderStatusCardV2(rec);\n"
  );

  if (patched === block) return { ok: false, reason: "no matching text template found" };

  src = src.slice(0, start) + patched + src.slice(next);
  return { ok: true, reason: "patched" };
}

const r1 = patchCommand("ref");
const r2 = patchCommand("status");

fs.writeFileSync(file, src, "utf8");

console.log("OK patched:", file);
console.log("Backup:", bak);
console.log("ref:", r1);
console.log("status:", r2);
