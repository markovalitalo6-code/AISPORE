const fs = require("fs");

const welcomeFile = "src/channels/telegram/welcome.ts";
const handlerFile = "src/channels/telegram/handler.ts";

const welcomeText = String.raw`🍄 AISPORE — Founding Players

⚠️ READ THIS (Telegram limitation)
Personal status (referrals, tickets, badges) cannot be shown reliably in the GROUP chat.
AISPORE uses a PRIVATE Host Bot for all personal info.

🤖 AISPORE Host Bot (PRIVATE CHAT)
1) Open: @AISporeHostBot
2) Press START (required once)
3) Use commands in the BOT chat (not here)

✅ Your status → /status
🔗 Your referral link → /ref
🏆 Leaderboard → /leaders

If the group says “Sent in private chat”
Open @AISporeHostBot → type /start once → then /status

Welcome in. Stay sharp. 🧬`;

const startText = String.raw`🤖 AISPORE Host Bot

This bot handles your personal AISPORE data.

Commands
✅ /status — your status card (badges, tickets, referrals)
🔗 /ref — your personal referral link
🏆 /leaders — top referrers

Important
• Use commands here (private chat)
• Group chat cannot show personal data
• Hold-based badges activate after AISPORE token + snapshot

You are now connected. 🧬`;

function patchWelcome() {
  let src = fs.readFileSync(welcomeFile, "utf8");

  const reWelcomeText = /const\s+welcomeText\s*=\s*`[\s\S]*?`\.trim\(\);/m;
  if (!reWelcomeText.test(src)) throw new Error("welcomeText not found in welcome.ts");

  const bak = welcomeFile + ".BAK." + Date.now();
  fs.copyFileSync(welcomeFile, bak);

  src = src.replace(reWelcomeText, `const welcomeText = \`${welcomeText}\`.trim();`);

  const reEndInit = /await\s+ensureUserRecord\([\s\S]*?\);\s*\n\s*}\s*catch\s*\(e\)\s*{\s*\n\s*console\.error\("Failed to init user record:",\s*e\);\s*\n\s*}\s*\n\s*}\s*$/m;

  if (reEndInit.test(src) && !src.includes("AUTO_DM_STATUS_ON_JOIN")) {
    src = src.replace(
      reEndInit,
      (m) => {
        const inject = `
  try {
    if (process.env.AUTO_DM_STATUS_ON_JOIN === "1") {
      const dmText = \`${startText}\n\nTip: type /status for your card.\`;
      await bot.api.sendMessage(memberUserId, dmText);
    }
  } catch (e) {
  }
`;
        return m.replace(/\n\s*}\s*$/m, inject + "\n}\n");
      }
    );
  }

  fs.writeFileSync(welcomeFile, src, "utf8");
  console.log("OK welcome patched");
}

function patchStart() {
  let src = fs.readFileSync(handlerFile, "utf8");

  const reStart = /bot\.command\(["']start["'][\s\S]*?\);\s*\n/m;
  if (!reStart.test(src)) {
    console.log("INFO start handler not found, skipping");
    return;
  }

  const bak = handlerFile + ".BAK.START." + Date.now();
  fs.copyFileSync(handlerFile, bak);

  const replacement = `bot.command("start", async (ctx) => {
  await ctx.reply(\`${startText}\`);
});\n`;

  src = src.replace(reStart, replacement);
  fs.writeFileSync(handlerFile, src, "utf8");
  console.log("OK start patched");
}

function patchStatus() {
  let src = fs.readFileSync(handlerFile, "utf8");

  const reStatus = /bot\.command\(["']status["'][\s\S]*?\);\s*\n/m;
  if (!reStatus.test(src)) throw new Error("status handler not found in handler.ts");

  const bak = handlerFile + ".BAK.STATUS." + Date.now();
  fs.copyFileSync(handlerFile, bak);

  const statusHandler = `bot.command("status", async (ctx) => {
  try {
    const userId = ctx.from?.id;
    const username = ctx.from?.username ?? "";
    if (!userId) return;

    const rec = await ensureUserRecord(userId, username);

    const invites = typeof rec.invites === "number" ? rec.invites : 0;
    const refBadge = rec.badgeLevel || "Bronze";
    const holdBadge = "Pre-launch (Pending)";
    const tickets = 1 + invites;

    const card =
\`🧬 AISPORE Status Card

👤 User: @\${username || "player"}
🔗 Invites: \${invites}
🏷️ Referral badge: \${refBadge}
💠 Hold badge: \${holdBadge}
🎟️ Tickets (pre-launch): \${tickets}

How to improve
• Invite friends using /ref
• Hold-based badges activate after AISPORE token + snapshot\`;

    if (ctx.chat?.type && ctx.chat.type !== "private") {
      try {
        await ctx.api.sendMessage(userId, card);
        await ctx.reply("Sent your AISPORE status to your DM. If you don't see it, open @AISporeHostBot and type /start.");
      } catch (e) {
        await ctx.reply("Open @AISporeHostBot and press START once, then type /status.");
      }
    } else {
      await ctx.reply(card);
    }
  } catch (e) {
    await ctx.reply("An error occurred while retrieving your AISPORE status.");
  }
});\n`;

  src = src.replace(reStatus, statusHandler);
  fs.writeFileSync(handlerFile, src, "utf8");
  console.log("OK status patched");
}

try {
  patchWelcome();
  patchStart();
  patchStatus();
  console.log("OK all patches applied");
} catch (e) {
  console.error("PATCH FAILED:", e.message);
  process.exit(1);
}
