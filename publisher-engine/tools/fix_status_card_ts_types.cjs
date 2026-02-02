const fs = require("fs");

const file = "src/channels/telegram/handler.ts";
if (!fs.existsSync(file)) {
  console.error("missing:", file);
  process.exit(1);
}

let src = fs.readFileSync(file, "utf8");

const startTag = "// === BUILD_AISPORE_STATUS_CARD_V1 ===";
const endTag = "// === END BUILD_AISPORE_STATUS_CARD_V1 ===";

const a = src.indexOf(startTag);
const b = src.indexOf(endTag);

if (a === -1 || b === -1 || b <= a) {
  console.error("status card markers not found, cannot patch safely");
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
      const recAny: any = rec as any;

      const refCode = typeof recAny?.refCode === "string" ? recAny.refCode : "";
      const invites = typeof recAny?.invites === "number" ? recAny.invites : 0;
      const referralBadge = typeof recAny?.badgeLevel === "string" ? recAny.badgeLevel : "Bronze";

      const link = refCode
        ? \`https://t.me/AISporeFoundingPlayers?start=\${refCode}\`
        : \`https://t.me/AISporeFoundingPlayers\`;

      const tickets = Math.max(0, 1 + (invites || 0));

      const text =
        \`RefCode: \${refCode || "(pending)"}\\n\` +
        \`Link: \${link}\\n\` +
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
`.trim();

const before = src.slice(0, a);
const after = src.slice(b + endTag.length);

const bak = file + ".BAK." + new Date().toISOString().replace(/[:.]/g, "-");
fs.copyFileSync(file, bak);
fs.writeFileSync(file, before + replacement + after, "utf8");

console.log("OK patched:", file);
console.log("Backup:", bak);
