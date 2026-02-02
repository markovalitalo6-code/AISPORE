const fs = require("fs");

const file = process.argv[2];
if (!file) {
  console.error("Usage: node patch_ref_status_lock_v2.cjs <path-to-handler.ts>");
  process.exit(1);
}

const src = fs.readFileSync(file, "utf8");

// Safety: must contain bot.command ref + status
if (!src.includes('bot.command("ref"') || !src.includes('bot.command("status"')) {
  console.error("PATCH ABORT: handler.ts does not contain expected bot.command(\"ref\") and bot.command(\"status\") blocks.");
  process.exit(1);
}

// Helper: replace a bot.command("X"...){...}); block safely
function replaceCommandBlock(source, cmd, newBlock) {
  const key = `bot.command("${cmd}"`;
  const idx = source.indexOf(key);
  if (idx === -1) throw new Error(`Missing command block: ${cmd}`);

  // Find start of block (at 'bot.command("cmd"...')
  let i = idx;

  // Find end of this command block by scanning parentheses depth from 'bot.command('
  const openParen = source.indexOf("(", i);
  if (openParen === -1) throw new Error(`Malformed command block: ${cmd} (no '(')`);

  let depth = 0;
  let end = -1;
  for (let p = openParen; p < source.length; p++) {
    const ch = source[p];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (depth === 0) {
      // Expect ');' after closing ')'
      const tail = source.slice(p, p + 3);
      if (tail.startsWith(");")) {
        end = p + 2; // include ");"
        break;
      }
    }
  }
  if (end === -1) throw new Error(`Could not find end of command block: ${cmd}`);

  // Include possible trailing semicolon/newlines
  let j = end;
  while (j < source.length && (source[j] === ";" || source[j] === "\n" || source[j] === "\r")) j++;

  const before = source.slice(0, i);
  const after = source.slice(j);

  return before + newBlock.trimEnd() + "\n\n" + after;
}

// New /ref block (NO status duplication)
const newRef = `
bot.command("ref", async (ctx) => {
  try {
    const userId = ctx.from?.id;
    const username = ctx.from?.username ?? "";
    if (!userId) return;

    const rec = await ensureUserRecord(userId, username);

    const refCode = (rec as any).refCode ?? "";
    const refLink = refCode
      ? \`https://t.me/AISporeFoundingPlayers?start=\${refCode}\`
      : "Referral code not ready yet. Try /start once.";

    const msg =
      "🔗 Your referral link:\\n" +
      refLink +
      "\\n\\n" +
      "📊 Full status, badges & tickets → /status";

    await ctx.reply(msg);
  } catch (e) {
    console.error("ref handler failed:", e);
    await ctx.reply("An error occurred while retrieving your referral info.");
  }
});
`;

// New /status block (Single source of truth: Status Card v2)
const newStatus = `
bot.command("status", async (ctx) => {
  try {
    const userId = ctx.from?.id;
    const username = ctx.from?.username ?? "";
    if (!userId) return;

    const rec = await ensureUserRecord(userId, username);

    // Status Card v2 (clean, no duplicates)
    const invites = typeof (rec as any).invites === "number" ? (rec as any).invites : 0;
    const referralBadge = (rec as any).badgeLevel ?? "Bronze";
    const refCode = (rec as any).refCode ?? "";
    const refLink = refCode ? \`https://t.me/AISporeFoundingPlayers?start=\${refCode}\` : "(not ready)";
    const tickets = 1 + Math.max(0, invites);

    const text =
      "🍄 AISPORE STATUS\\n\\n" +
      "🏷️ Referral Badge: " + referralBadge + "\\n" +
      "👥 Invites: " + invites + "\\n" +
      "🎟️ Tickets (pre-launch): " + tickets + "\\n\\n" +
      "🔗 Your Referral Link:\\n" +
      refLink + "\\n\\n" +
      "⏳ Hold Badge: Pre-launch (activates at token + snapshot)\\n" +
      "🧬 AISPORE";

    await ctx.reply(text);
  } catch (e) {
    console.error("status handler failed:", e);
    await ctx.reply("An error occurred while retrieving your status.");
  }
});
`;

let out = src;
out = replaceCommandBlock(out, "ref", newRef);
out = replaceCommandBlock(out, "status", newStatus);

// Backup + write
const bak = file + ".BAK." + new Date().toISOString().replace(/[:.]/g, "-");
fs.copyFileSync(file, bak);
fs.writeFileSync(file, out, "utf8");

console.log("OK patched:", file);
console.log("Backup:", bak);
