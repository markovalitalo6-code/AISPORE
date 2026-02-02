const fs = require("fs");

const file = "src/channels/telegram/handler.ts";
if (!fs.existsSync(file)) {
  console.error("PATCH FAILED: missing", file);
  process.exit(1);
}

const src = fs.readFileSync(file, "utf8");

// jos jo on /status, ei tehdä mitään
if (/bot\.command\(\s*["']status["']/.test(src)) {
  console.log("INFO: /status already exists, skipping.");
  process.exit(0);
}

// etsitään paikka ennen ensimmäistä /ref-komentoa
const idx = src.search(/bot\.command\(\s*["']ref["']/);
if (idx === -1) {
  console.error("PATCH FAILED: could not find bot.command('ref') in handler.ts");
  process.exit(1);
}

const inject = `
  // === AISPORE STATUS ALIASES (AUTO) ===
  // Telegram UX: welcome tells users /status /badges /tickets. Make them work.
  bot.command("status", async (ctx) => {
    await ctx.reply("✅ Your status is currently shown via /ref (same DM).\\n\\nType /ref here to see: referral link, badges, tickets.\\n\\nHold-based badges will activate at token + snapshot launch. 🍄");
  });

  bot.command("badges", async (ctx) => {
    await ctx.reply("🏷️ Badges are shown via /ref (same DM).\\n\\nType /ref here to see your current badge + hold badge (pending).");
  });

  bot.command("tickets", async (ctx) => {
    await ctx.reply("🎟️ Tickets are shown via /ref (same DM).\\n\\nType /ref here to see your pre-launch tickets.");
  });
  // === END STATUS ALIASES ===

`;

const out = src.slice(0, idx) + inject + src.slice(idx);

const bak = file + ".BAK." + new Date().toISOString().replace(/[:.]/g, "-");
fs.copyFileSync(file, bak);
fs.writeFileSync(file, out, "utf8");

console.log("OK patched:", file);
console.log("Backup:", bak);
