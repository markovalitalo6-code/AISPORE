const fs = require("fs");

const file = "src/channels/telegram/handler.ts";
if (!fs.existsSync(file)) {
  console.error("PATCH FAILED: missing", file);
  process.exit(1);
}

let src = fs.readFileSync(file, "utf8");

if (src.includes("BUILD_AISPORE_STATUS_CARD_V1")) {
  console.log("INFO: status card patch already applied, skipping.");
  process.exit(0);
}

const marker = `bot.command("status", async (ctx) => {`;
const i = src.indexOf(marker);
if (i === -1) {
  console.error("PATCH FAILED: could not find /status command block in handler.ts");
  process.exit(1);
}

const j = src.indexOf("});", i);
if (j === -1) {
  console.error("PATCH FAILED: could not find end of /status block");
  process.exit(1);
}

const replacement = `
  // === BUILD_AISPORE_STATUS_CARD_V1 ===
  bot.command("status", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      const username = ctx.from?.username ?? "";
      if (!userId) return;

      const rec = await ensureUserRecord(userId, username);

      const refCode = (rec && (rec.refCode || rec.ref || rec.code)) ? (rec.refCode || rec.ref || rec.code) : "";
      const invites = typeof rec?.invites === "number" ? rec.invites : (typeof rec?.inviteCount === "number" ? rec.inviteCount : 0);
      const referralBadge = (rec && (rec.badgeLevel || rec.badge)) ? (rec.badgeLevel || rec.badge) : "Bronze";

      const link = refCode
        ? \`https://t.me/AISporeFoundingPlayers?start=\${refCode}\`
        : \`https://t.me/AISporeFoundingPlayers\`;

      const tickets = Math.max(0, 1 + (invites || 0));

      const text =
        \`RefCode: \${refCode || "(pending)"}\\n\` +
        \`Link: \${link}\\n\` +
        \`Badge: \${referralBadge}\\n\` +
        \`Invites: \${invites}\\n\` +
        \`Referral badge: \${referralBadge}\\n\` +
        \`Hold badge: Pre-launch (Pending)\\n\` +
        \`Tickets (pre-launch): \${tickets}\\n\\n\` +
        \`Note: Hold-based badges activate when AISPORE token + snapshot go live.\`;

      await ctx.api.sendMessage(userId, text);
      await ctx.reply("Sent your status in a private chat. ✅");
    } catch (e) {
      await ctx.reply("An error occurred while retrieving your status.");
    }
  });
  // === END BUILD_AISPORE_STATUS_CARD_V1 ===
`;

const out = src.slice(0, i) + replacement + src.slice(j + 3);

const bak = file + ".BAK." + new Date().toISOString().replace(/[:.]/g, "-");
fs.copyFileSync(file, bak);
fs.writeFileSync(file, out, "utf8");

console.log("OK patched:", file);
console.log("Backup:", bak);
