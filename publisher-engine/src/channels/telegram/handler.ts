const WELCOME_PACK = [
  '🍄 Welcome to AISPORE — Founding Players',
  '',
  'You’re now inside the early pipeline: access, perks, and the first real game mechanics. 🧠⚙️',
  '',
  '✅ What is AISPORE?',
  'A community + token + reward ecosystem built to last.',
  'This is not “join & forget” — this is build + hold + win. 🚀',
  '',
  '🧬 How rewards work (kept flexible on purpose)',
  'We reward actions that strengthen AISPORE, such as:',
  '• bringing in quality new members',
  '• staying active & contributing',
  '• holding AISPORE tokens',
  '',
  '⚠️ No fixed numbers are promised yet.',
  'We will adjust tickets/rewards to keep it fair, sustainable, and anti-abuse.',
  '',
  '🪙 Token requirement (important)',
  'To participate in draws / premium rewards, you must hold AISPORE tokens.',
  'If you don’t hold — you’re basically in spectator mode.',
  '',
  '📈 Bigger ecosystem = bigger potential',
  'As adoption + utility + market cap grow, reward potential can scale too. 📈',
  '',
  '🏷️ Badges',
  'Badges represent contribution level and unlock future perks when activated.',
  '',
  '🧯 Rules (short & strict)',
  '• No spam / no fake accounts',
  '• No invite farming / botting',
  '• No random token shilling',
  '• Respect the community — we protect builders',
  '',
  '👇 Next step',
  'Tap the button below to join the Founding Players group.',
].join("\n");

import { Bot, Context, InlineKeyboard } from "grammy";

// AISPORE_TESTMODE_CHESTWIRE_V1
import { ensureSchema } from "../../services/testmode/db";
import { isTestMode, setTestMode, setMC, getMC } from "../../services/testmode/state";
import { addTickets, getTickets, topTickets } from "../../services/testmode/tickets";
import { aiGateOpen } from "../../services/testmode/ai";
import { openChestEvent, getLatestWinners } from "../../services/testmode/chest";
import crypto from "crypto";
/* AISPORE_SNAKE_SCORES_V1
   Stores snake scores in SQLite and provides /leaderboard + /snakewin (admin).
*/
import rewardsDb from "../../services/rewards/db";
function isoWeekUTC(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
function ensureSnakeTable() {
  try {
    rewardsDb.exec(`
      CREATE TABLE IF NOT EXISTS snake_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegramId INTEGER NOT NULL,
        username TEXT,
        score INTEGER NOT NULL,
        weekNumber INTEGER NOT NULL,
        runId TEXT,
        createdAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_snake_scores_week ON snake_scores(weekNumber);
      CREATE INDEX IF NOT EXISTS idx_snake_scores_user_week ON snake_scores(telegramId, weekNumber);
    `);
  } catch (e) {
    console.log('[SNAKE] ensure table failed', e);
  }
}
function insertSnakeScore(telegramId: number, username: string | undefined, score: number, runId?: string) {
  ensureSnakeTable();
  const weekNumber = isoWeekUTC(new Date());
  rewardsDb.prepare(
    "INSERT INTO snake_scores (telegramId, username, score, weekNumber, runId, createdAt) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(telegramId, username || null, score, weekNumber, runId || null, new Date().toISOString());
  return { weekNumber };
}
function topSnakeWeek(limit = 10) {
  ensureSnakeTable();
  const weekNumber = isoWeekUTC(new Date());
  const rows = rewardsDb.prepare(
    "SELECT telegramId, username, MAX(score) as bestScore FROM snake_scores WHERE weekNumber=? GROUP BY telegramId ORDER BY bestScore DESC LIMIT ?"
  ).all(weekNumber, limit);
  return { weekNumber, rows };
}
/* END AISPORE_SNAKE_SCORES_V1 */

import fs from "fs";
import path from "path";
import { handleNewGroupMember } from "./welcome";

// === AISPORE_WELCOME_PACK_V1 ===
// NOTE: Keep this copy stable; adjust later in one place only.
const AISPORE_JOIN_URL = "https://t.co/VopXfjhqIe";



const AISPORE_SNAKE_SIGN_V1 = true;
const SNAKE_BASE_URL = (process.env.SNAKE_BASE_URL || "http://127.0.0.1:5179").replace(/\/$/, "");
const SNAKE_SECRET = String(process.env.SNAKE_SECRET || "");
function snakeSig(tgId: number, ts: number) {
  const msg = tgId + ":" + ts;
  return crypto.createHmac("sha256", SNAKE_SECRET).update(msg).digest("hex");
}
const AISPORE_SNAKE_BASEURL_V1 = true;
function aisporeWelcomePackText() {
  return (WELCOME_PACK);
}


import { ensureUserRecord, getUserBadgeRecord, getLeaderboard, onReferralUsed, findInviterUserIdByRefCode } from "./referral";



import { setPendingReferral, popPendingReferral } from "./referral.pending";

// === AISPORE REWARDS v1 (auto-added) ===
import { playSnakeCheckIn, topLeaderboard } from "../../services/rewards/engine";
import { startRewardCron } from "../../services/rewards/cron";
// === END AISPORE REWARDS v1 ===

// === REFERRAL_CONSUMED_V1 (anti-duplicate credit) ===
const REF_CONSUMED_PATH = path.join(process.cwd(), "data", "referral_consumed.json");
type ConsumedMap = Record<string, { inviterId: number; refCode: string; ts: number }>;
function readConsumed(): ConsumedMap {
  try {
    if (!fs.existsSync(REF_CONSUMED_PATH)) return {};
    const raw = fs.readFileSync(REF_CONSUMED_PATH, "utf8");
    const obj = raw && raw.trim().length ? JSON.parse(raw) : {};
    return (obj && typeof obj === "object") ? (obj as ConsumedMap) : {};
  } catch {
    return {};
  }
}
function writeConsumed(m: ConsumedMap) {
  try {
    fs.mkdirSync(path.dirname(REF_CONSUMED_PATH), { recursive: true });
    fs.writeFileSync(REF_CONSUMED_PATH, JSON.stringify(m, null, 2), "utf8");
  } catch {}
}
function consumedKey(joinerId: number, refCode: string) {
  return `${joinerId}:${refCode}`;
}
function isConsumed(joinerId: number, refCode: string) {
  const m = readConsumed();
  return Boolean(m[consumedKey(joinerId, refCode)]);
}
function markConsumed(joinerId: number, inviterId: number, refCode: string) {
  const m = readConsumed();
  m[consumedKey(joinerId, refCode)] = { inviterId, refCode, ts: Date.now() };
  writeConsumed(m);
}
// === END REFERRAL_CONSUMED_V1 ===

/* AISPORE_STATUS_CARD_V2
 * Status Card v2 (DM): single deterministic render used by /ref and /status.
 */
function renderStatusCardV2(rec: any) {
  const refCode = String(rec?.refCode ?? "");
  const invites = typeof rec?.invites === "number" ? rec.invites : 0;
  const referralBadge = String(rec?.badgeLevel ?? "Bronze");
  const tickets = Math.max(1, 1 + invites);

  const link = refCode
    ? `https://t.me/AISporeHostBot?start=${encodeURIComponent(refCode)}`
    : "Open @AISporeHostBot and type /start once, then /ref.";

  return `🍄 AISPORE STATUS

🏷️ Referral Badge: ${referralBadge}
👥 Invites: ${invites}
🎟️ Tickets (pre-launch): ${tickets}

🔗 Your Referral Link:
${link}

⏳ Hold Badge:
Pre-launch (activates at token + snapshot)

🧬 AISPORE`.trim();
}

export function setupTelegramBot(bot: Bot) {
  // Global error handler (avoid bot crash)
  bot.catch((err) => {
    try {
      console.error('[BOT_ERROR]', err?.error || err);
    } catch {}
  });

  // === AISPORE REWARDS v1: start cron jobs (UTC) ===
  startRewardCron();
  // === END AISPORE REWARDS v1 ===

  // === DEBUG: chat_member updates (Telegram may not emit new_chat_members) ===
  bot.on("chat_member", async (ctx) => {
    try {
      console.log("[CHAT_MEMBER_DEBUG]", (ctx.update as any)?.chat_member);
    } catch (e) {
      console.log("[CHAT_MEMBER_DEBUG] error", e);
    }
  });

  bot.on("my_chat_member", async (ctx) => {
    try {
      console.log("[MY_CHAT_MEMBER_DEBUG]", (ctx.update as any)?.my_chat_member);
    } catch (e) {
      console.log("[MY_CHAT_MEMBER_DEBUG] error", e);
    }
  });
  // === END DEBUG ===




  // === /start: DM gateway + Join Founding Players button ===
  bot.command("start", async (ctx) => {
  // DM-only: avoid posting /start (and referral payload) into groups
  if (ctx.chat?.type !== "private") return;
    try {
      const payload = (ctx as any).match ? String((ctx as any).match).trim() : "";

      try {
        const joinerId = ctx.from?.id;
        const joinerUsername = ctx.from?.username;
        if (joinerId) await ensureUserRecord(joinerId, joinerUsername);
        const refCode = payload && payload.length ? payload : "";
        if (refCode && joinerId) {
          await setPendingReferral(joinerId, refCode);
          console.log("[REF] pending", { joinerId, refCode });
        }
      } catch (e) {
        console.log("[REF] pending error", e);
      }
      const kb = new InlineKeyboard().url("🚀 Join Founding Players", "https://t.co/VopXfjhqIe");
      const pending = payload ? String(payload).trim() : "";

      const welcomeText = pending

        ? `${WELCOME_PACK}

⏳ Pending referral detected: ${pending}
(Join the Founding Players group to confirm.)`

        : WELCOME_PACK;

      await ctx.reply(welcomeText, { reply_markup: kb });
// NOTE: payload is available as `payload` if you want to attribute referrals here.
      // Keep existing referral attribution logic elsewhere untouched.
    } catch (e) {
      console.error("start handler failed:", e);
      await ctx.reply("An error occurred while starting. Try again in a moment.");
    }



  // === DEV/TEST: /confirm (DM only) ===
  // Lets OWNER confirm pending referral without needing join event (use only in test mode)
// === END DEV/TEST ===


});


  // === /panel: DM-only control panel ===
  
bot.command("panel", async (ctx) => {
  try {
    if (ctx.chat?.type !== "private") {
      await ctx.reply("📩 Panel toimii vain DM:ssä. Avaa botti yksityisviestiin.");
      return;
    }
    const userId = ctx.from?.id;
    if (!userId) return;

    const username = ctx.from?.username || "";
    const rec: any = await ensureUserRecord(userId, username);

    const refCode = String(rec?.refCode ?? "");
    const badge = String(rec?.badgeLevel ?? "Bronze");
    const invites = Number(rec?.invites ?? 0);

    const botUser = (ctx.me && (ctx.me as any).username) ? String((ctx.me as any).username) : "AISporeHostBot";
    const refLink = refCode ? `https://t.me/${botUser}?start=${encodeURIComponent(refCode)}` : "";

    console.log("[PANEL] opened by", userId);

    const kbAll = new (require("grammy").InlineKeyboard)()
      .url("📎 Copy invite link", refLink || "https://t.me/" + botUser).row()
      .text("🎟 Tickets", "panel:tickets").text("🏷 Badges", "panel:badges").row()
      .text("📊 Status", "panel:status").text("🏆 Leaderboard", "panel:leaderboard").row()
      .text("🐍 Snake", "panel:snake").text("🔗 My Invite", "panel:ref");

    const text = `🧬 *AISPORE PANEL*

🏷 Badge: *${badge}*
👥 Invites: *${invites}*

🔑 Ref code: ${refCode ? "`" + refCode + "`" : "(pending)"}
${refLink ? "🔗 Invite link:\n" + refLink : ""}

Valitse toiminto napeista 👇`;

    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kbAll });
  } catch (e) {
    console.log("[PANEL] error", e);
    try { await ctx.reply("❌ Panel failed. Check logs."); } catch {}
  }
});

  // === PANEL_V3_START ===

  // Panel buttons -> run the SAME command handlers as typed messages (stable)
  bot.callbackQuery(/^panel:(.+)$/, async (ctx) => {
    try {
      const action = (ctx.match && ctx.match[1]) ? String(ctx.match[1]) : "";
      await ctx.answerCallbackQuery(); // poistaa "loading..." spinnerin

      if (ctx.chat?.type !== "private") {
        await ctx.reply("📩 Panel toimii vain DM:ssä. Avaa botti yksityisviestinä.");
        return;
      }

      const map: Record<string, string> = {
  status: "/status",
  tickets: "/tickets",
  badges: "/badges",
  snake: "/snake",
  leaderboard: "/leaderboard",
  ref: "/panel",
};


      const cmd = map[action];
      console.log("[PANEL_CLICK_CMD]", { from: ctx.from?.id, action, cmd });

      if (!cmd) {
        await ctx.reply("❓ Unknown panel action: " + action);
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const len = cmd.length;

      const fakeUpdate: any = {
        update_id: Number(String(Date.now()).slice(-9)), // tarpeeksi uniikki
        message: {
          message_id: now,
          date: now,
          chat: ctx.chat,
          from: ctx.from,
          text: cmd,
          entities: [{ offset: 0, length: len, type: "bot_command" }],
        },
      };

      await bot.handleUpdate(fakeUpdate);
    } catch (e) {
      console.log("[PANEL_CLICK] error", e);
      try { await ctx.answerCallbackQuery({ text: "Panel error (katso logit)" }); } catch {}
    }
  });

  // === PANEL_V3_END ===
// === /confirm: manual referral confirmation (dev/test) ===
  // === AISPORE REWARDS v1 COMMANDS (auto-added) ===
  // /snake -> opens the Nokia-style Snake page (web) + check-in happens in-game later
  bot.command("snake", async (ctx) => {
    try {
      if (ctx.chat?.type !== "private") {
        await ctx.reply("🐍 Avaa peli DM:ssä: kirjoita @AISporeHostBot ja komento /snake");
        return;
      }
      const base = process.env.SNAKE_BASE_URL || "${SNAKE_BASE_URL}";
      const url = base.replace(/\/$/, "") + "/snake?tg=" + encodeURIComponent(String(ctx.from?.id || ""));
      await ctx.reply("🐍 Snake v1 — avaa peli tästä:", {
        reply_markup: new (require("grammy").InlineKeyboard)().url("▶️ PLAY SNAKE", url)
      });
    } catch (e) {
      console.log("[snake] error", e);
      await ctx.reply("❌ Snake-linkin luonti epäonnistui. Katso logit.");
    }
  });

  // /leaderboard -> top ticket earners (from rewards db)
  bot.command(["leaderboard","toptickets"], async (ctx) => {
    try {
      if (ctx.chat?.type !== "private") return;
      const top = topLeaderboard(10);
      if (!top.length) {
        await ctx.reply("ℹ️ Leaderboard on tyhjä (ei vielä tikettejä). Pelaa /snake ja tee check-in.");
        return;
      }
      let msg = "🏆 AISPORE Tickets — TOP 10\n\n";
      top.forEach((u, i) => {
        const uu = u as any;
        msg += (i+1) + ". " + uu.userId + " — " + uu.ticketsTotal + " 🎟 (" + uu.tier + ")\n";
      });
      await ctx.reply(msg.trim());
    } catch (e) {
      console.log("[leaderboard] error", e);
      await ctx.reply("❌ Leaderboard epäonnistui. Katso logit.");
    }
  });
  // === END AISPORE REWARDS v1 COMMANDS ===


  /* AISPORE_SNAKE_COMMANDS_V1 */
  bot.command("leaderboard", async (ctx) => {
    try {
      if (ctx.chat?.type !== "private") return;
      const { weekNumber, rows } = topSnakeWeek(10);
      if (!rows.length) {
        await ctx.reply("🐍 AISPORE SNAKE — no scores yet this week. Play first!");
        return;
      }
      const lines = rows.map((r:any, i:number) => {
        const name = r.username ? ("@" + r.username) : ("tg:" + r.telegramId);
        return `${i+1}. ${name} — ${r.bestScore}`;
      });
      await ctx.reply(`🐍 AISPORE SNAKE — Weekly Leaderboard (week ${weekNumber})\n\n${lines.join("\n")}\n\nTip: play again to beat your best.`);
    } catch (e) {
      console.log("[SNAKE] /leaderboard error", e);
      await ctx.reply("❌ Leaderboard failed. Check logs.");
    }
  });

  bot.command("snakewin", async (ctx) => {
    try {
      if (ctx.chat?.type !== "private") return;
      const owner = process.env.OWNER_TELEGRAM_ID ? String(process.env.OWNER_TELEGRAM_ID) : "";
      const uid = ctx.from?.id ? String(ctx.from.id) : "";
      if (!owner || uid !== owner) {
        await ctx.reply("⛔ Admin only.");
        return;
      }
      const { weekNumber, rows } = topSnakeWeek(1);
      if (!rows.length) {
        await ctx.reply("No scores this week.");
        return;
      }
      const r:any = rows[0];
      const winner = r.username ? ("@" + r.username) : ("tg:" + r.telegramId);
      await ctx.reply(`🏆 Week ${weekNumber} winner: ${winner} — ${r.bestScore}\n\n(Payout: pending — will be automated after AISPORE launch)`);
    } catch (e) {
      console.log("[SNAKE] /snakewin error", e);
      await ctx.reply("❌ /snakewin failed.");
    }
  });
  /* END AISPORE_SNAKE_COMMANDS_V1 */

  bot.command("confirm", async (ctx) => {
    try {
      if (ctx.chat?.type !== "private") return;
      const userId = ctx.from?.id;
      if (!userId) return;

      const ALLOW_SELF_REF_TEST = process.env.ALLOW_SELF_REF_TEST === "true";
      const OWNER_TELEGRAM_ID = process.env.OWNER_TELEGRAM_ID ? String(process.env.OWNER_TELEGRAM_ID) : "";

      if (!ALLOW_SELF_REF_TEST || !OWNER_TELEGRAM_ID || String(userId) !== OWNER_TELEGRAM_ID) {
        await ctx.reply("⛔ /confirm is disabled.");
        return;
      }

      const refCode = await popPendingReferral(userId);
      if (!refCode) {
        await ctx.reply("ℹ️ No pending referral found for you.");
        return;
      }

      const inviterId = await findInviterUserIdByRefCode(refCode);
      if (!inviterId) {
        await ctx.reply("⚠️ Ref code not found in inviter registry: " + refCode);
        return;
      }

      // Dedup: avoid consuming same (joinerId, refCode) twice
      if (isConsumed(userId, refCode)) {
        await ctx.reply("✅ Already confirmed earlier: " + refCode);
        return;
      }

      markConsumed(userId, inviterId, refCode);
      await onReferralUsed(inviterId);
      console.log("[REF] confirmed via /confirm (self-test)", { joinerId: userId, inviterId, refCode });

      await ctx.reply("✅ Confirmed referral: " + refCode + "\nInviter credited: " + inviterId);
    } catch (e) {
      console.log("[REF] /confirm error", e);
      await ctx.reply("❌ /confirm failed. Check logs.");
    }
  });
  

const FOUNDING_GROUP_ID = process.env.TELEGRAM_CHAT_ID;


  // === DEV/TEST FLAG: allow self-referral ONLY for OWNER_TELEGRAM_ID ===
  const ALLOW_SELF_REF_TEST = process.env.ALLOW_SELF_REF_TEST === "true";
  const OWNER_TELEGRAM_ID = process.env.OWNER_TELEGRAM_ID ? String(process.env.OWNER_TELEGRAM_ID) : "";
  if (!FOUNDING_GROUP_ID) {
    console.warn(
      "TELEGRAM_CHAT_ID is not set. Join events for the founding group will be ignored."
    );
  }

  // New members in the founding group
  bot.on("message:new_chat_members", async (ctx: Context) => {
    await handleNewGroupMember(ctx);

    console.log("[JOIN_DEBUG] new_chat_members event", { chatId: ctx.chat?.id, chatType: ctx.chat?.type, title: (ctx.chat && (ctx.chat.title || ctx.chat.username)) || "", members: (ctx.update as any)?.message?.new_chat_members?.map((x:any)=>({id:x.id, username:x.username, first_name:x.first_name})) });
    try {
      const newMembers = ctx.update?.message?.new_chat_members;
      if (!newMembers || !Array.isArray(newMembers)) return;

      const chatId = ctx.chat?.id;
      if (!chatId || !FOUNDING_GROUP_ID || String(chatId) !== String(FOUNDING_GROUP_ID)) {
        console.log("[REF] join event ignored (chat mismatch)", {
          chatId,
          expected: FOUNDING_GROUP_ID,
          title: (ctx.chat && (ctx.chat.title || ctx.chat.username)) || ""
        });
        return;
      }
      if (
        chatId &&
        FOUNDING_GROUP_ID &&
        String(chatId) === String(FOUNDING_GROUP_ID)
      ) {
        for (const member of newMembers) {

        try {
          const joinerId = (member && (member.id)) ? Number(member.id) : null;
          const joinerUsername = (member && (member.username)) ? String(member.username) : undefined;
          if (joinerId) await ensureUserRecord(joinerId, joinerUsername);

          if (joinerId) {
            const refCode = await popPendingReferral(joinerId);
            if (refCode) {
              const inviterId = await findInviterUserIdByRefCode(refCode);
              if (inviterId && (inviterId !== joinerId || (ALLOW_SELF_REF_TEST && OWNER_TELEGRAM_ID && String(joinerId) === OWNER_TELEGRAM_ID))) {
                  if (inviterId === joinerId) console.log("[REF] SELF-TEST MODE used", { joinerId, inviterId });
                // anti-dup: credit each (joinerId, refCode) only once

                if (isConsumed(joinerId, refCode)) {

                  console.log("[REF] already consumed", { joinerId, inviterId, refCode });

                } else {

                  markConsumed(joinerId, inviterId, refCode);

                  await onReferralUsed(inviterId);

                }

                console.log("[REF] confirmed", { joinerId, inviterId, refCode });
              } else {
                console.log("[REF] confirm skipped", { joinerId, inviterId, refCode });
              }
            }
          }
        } catch (e) {
          console.log("[REF] confirm error", e);
        }

          const userId = member.id;
          const username = member.username ?? member.first_name ?? "";
          await handleNewGroupMember(ctx);
        }
      }
    } catch (e) {
      console.error("Error handling new group member:", e);
    }
  });

  // /ref – show personal referral link
  
  // === AISPORE STATUS ALIASES (AUTO) ===
  // Telegram UX: welcome tells users /status /badges /tickets. Make them work.
  
  // === BUILD_AISPORE_STATUS_CARD_V1 ===
  
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
    const refLink = refCode ? `https://t.me/AISporeHostBot?start=${encodeURIComponent(refCode)}` : "(not ready)";
    const tickets = 1 + Math.max(0, invites);

    const text =
      "🍄 AISPORE STATUS\n\n" +
      "🏷️ Referral Badge: " + referralBadge + "\n" +
      "👥 Invites: " + invites + "\n" +
      "🎟️ Tickets (pre-launch): " + tickets + "\n\n" +
      "🔗 Your Referral Link:\n" +
      refLink + "\n\n" +
      "⏳ Hold Badge: Pre-launch (activates at token + snapshot)\n" +
      "🧬 AISPORE";

    await ctx.reply(text);
  } catch (e) {
    console.error("status handler failed:", e);
    await ctx.reply("An error occurred while retrieving your status.");
  }
});

  // === END BUILD_AISPORE_STATUS_CARD_V1 ===


  
bot.command("badges", async (ctx) => {
  try {
    const userId = ctx.from?.id;
    const username = ctx.from?.username ?? "";
    if (!userId) return;

    const rec: any = await ensureUserRecord(userId, username);

    const refCode = String(rec?.refCode ?? "");
    const badge = String(rec?.badgeLevel ?? "Bronze");
    const invites = Number(rec?.invites ?? 0);

    const botUser = (ctx.me && (ctx.me as any).username) ? String((ctx.me as any).username) : "AISporeHostBot";
    const refLink = refCode ? `https://t.me/${botUser}?start=${encodeURIComponent(refCode)}` : "";

    const msg = [
      "🏷️ Referral Badge: " + badge,
      "👥 Invites: " + invites,
      refCode ? ("🔑 Ref code: " + refCode) : "🔑 Ref code: (pending)",
      refLink ? ("🔗 Invite link: " + refLink) : ""
    ].filter(Boolean).join("\n");

    await ctx.reply(msg);
  } catch (e) {
    console.log("[badges] error", e);
    try { await ctx.reply("⚠️ Badges error. Try again."); } catch {}
  }
});

  bot.command("tickets", async (ctx) => {
    await ctx.reply("🎟️ Tickets are shown via /ref (same DM).\n\nType /ref here to see your pre-launch tickets.");
  });
  // === END STATUS ALIASES ===



bot.command("ref", async (ctx) => {
  try {
    if (ctx.chat?.type !== "private") {
      await ctx.reply("📩 /ref toimii vain DM:ssä. Avaa botti yksityisviestiin.");
      return;
    }

    const userId = ctx.from?.id;
    const username = ctx.from?.username ?? "";
    if (!userId) return;

    const rec: any = await ensureUserRecord(userId, username);

    const refCode = String(rec?.refCode ?? "");
    const botUser = (ctx.me && (ctx.me as any).username) ? String((ctx.me as any).username) : "AISporeHostBot";
    const refLink = refCode ? `https://t.me/${botUser}?start=${encodeURIComponent(refCode)}` : "";

    const msg =
      "🔗 *My Invite*\n\n" +
      (refCode ? ("🔑 Ref code: `" + refCode + "`\n") : "🔑 Ref code: (pending)\n") +
      (refLink ? ("🔗 Invite link:\n" + refLink + "\n\n") : "\n") +
      "📊 Full status, badges & tickets → /status";

    if (refLink) {
      const kb = new (require("grammy").InlineKeyboard)().url("📎 Copy invite link", refLink);
      await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: kb });
    } else {
      await ctx.reply(msg, { parse_mode: "Markdown" });
    }
  } catch (e) {
    console.error("ref handler failed:", e);
    await ctx.reply("An error occurred while retrieving your referral info.");
  }
});

  // /me – show own badge status (alias /badge)
  bot.command(["me", "badge"], async (ctx) => {
    try {
      const from = ctx.from;
      if (!from) {
        await ctx.reply("Unable to determine user.");
        return;
      }

      const userId = from.id;
      const username = from.username ?? from.first_name ?? "";
      const rec = await ensureUserRecord(userId, username);

      const text = `🍄 Your AISPORE status:

User: ${username || userId}
Badge: ${rec.badgeLevel}
Invites: ${rec.invites}
Referral badge: ${rec.badgeLevel}
Hold badge: Pre-launch (Pending)
Tickets (pre-launch): ${(1 + (rec.invites || 0))}
Referral badge: ${rec.badgeLevel}
Hold badge: Pre-launch (Pending)
Tickets (pre-launch): ${1 + (rec.invites || 0)}

Note: Hold-based badges activate when AISPORE token + snapshot go live.

Your personal link:
https://t.me/AISporeHostBot?start=${encodeURIComponent(rec.refCode)}`;

      if (ctx.chat?.type === "private") {
        await ctx.reply(text);
      } else {
        try {
          await ctx.api.sendMessage(userId, text);
          await ctx.reply(
            "Sent your AISPORE status to your DM. If you don't see it, open @AISporeHostBot and type /start."
          );
        } catch (e) {
          console.error("Error DM-ing /me info, replying in group instead:", e);
          await ctx.reply(text);
        }
      }
    } catch (e) {
      console.error("Error handling /me:", e);
      await ctx.reply("An error occurred while retrieving your status.");
    }
  });

  // /top – leaderboard
  bot.command(["top", "leaders"], async (ctx) => {
    try {
      const leaders = await getLeaderboard(10);

      if (!leaders.length) {
        await ctx.reply("No referral data yet. Be the first to invite someone. 🍄");
        return;
      }

      let text = "🏆 AISPORE Referral Leaders:\n\n";
      leaders.forEach((rec, idx) => {
        const name = rec.username
          ? `@${rec.username}`
          : `User ${rec.userId}`;
        text += `${idx + 1}. ${name} — ${rec.badgeLevel} (invites: ${rec.invites})\n`;
      });

      await ctx.reply(text);
    } catch (e) {
      console.error("Error handling /top:", e);
      await ctx.reply("An error occurred while retrieving the leaderboard.");
    }
  });

  bot.command("mc", async (ctx) => {
    if (ctx.chat?.type !== "private") return;
    const arg = (ctx.message?.text || "").split(/\s+/).slice(1).join(" ").trim();
    const n = Number(arg);
    if (!Number.isFinite(n)) { await ctx.reply("Usage: /mc 3000   (sets test MC)"); return; }
    setMC(Math.floor(n));
    await ctx.reply("✅ Test MC set to: " + getMC());
  });



  bot.command("testmode_on", async (ctx) => {
    if (ctx.chat?.type !== "private") return;
    setTestMode(true);
    await ctx.reply("✅ Test mode ON");
  });



  bot.command("testmode_off", async (ctx) => {
    if (ctx.chat?.type !== "private") return;
    setTestMode(false);
    await ctx.reply("✅ Test mode OFF");
  });



  bot.command("ticket", async (ctx) => {
    if (ctx.chat?.type !== "private") return;
    const id = String(ctx.from?.id || "");
    const u = ctx.from?.username ? String(ctx.from.username) : "";
    const score = addTickets(Number(id), 1, "manual_ticket");
    await ctx.reply("🎟 Ticket score: " + score + (u ? " (@"+u+")" : ""));
  });



  bot.command("ticket2", async (ctx) => {
    if (ctx.chat?.type !== "private") return;
    const id = String(ctx.from?.id || "");
    const u = ctx.from?.username ? String(ctx.from.username) : "";
    const score = addTickets(Number(id), 5, "manual_ticket2");
    await ctx.reply("🎟 Ticket score: " + score + (u ? " (@"+u+")" : ""));
  });



  bot.command("chest_open", async (ctx) => {
    if (ctx.chat?.type !== "private") return;
    const uid = String(ctx.from?.id || "");
    const owner = String(process.env.OWNER_TELEGRAM_ID || "");
    if (!owner || uid !== owner) { await ctx.reply("⛔ admin only"); return; }
    if (!isTestMode()) { await ctx.reply("ℹ️ Test mode is OFF"); return; }
    const gate = aiGateOpen();
    if (!gate.allowOpen){ await ctx.reply("AI gate blocked: " + gate.reason); return; }

    const res = openChestEvent({ mc: getMC() });
    if (!res.winners.length) {
      await ctx.reply("🧰 CHEST OPEN (event #" + res.eventId + ")\nNo eligible tickets (empty chest ritual).\nMC=" + res.mc);
      return;
    }
    const lines = res.winners.map((w:any,i:number)=> (i+1) + ") " + (w.username ? "@"+w.username : "tg:"+w.tgId) + " — " + w.prize);
    await ctx.reply("🧰 CHEST OPEN (event #" + res.eventId + ")\nMC=" + res.mc + "\n" + lines.join("\n"));
  });



  bot.command("winners", async (ctx) => {
    const list = getLatestWinners(3);
    if (!list.length) { await ctx.reply("No chest events yet."); return; }
    const out = [];
    for (const ev of list) {
      out.push("🧰 Event #" + ev.eventId + " | MC=" + ev.mc + " | participants=" + ev.snapshotCount);
      const wins = (ev.winners || []);
      if (!wins.length) out.push("  (empty chest)");
      else wins.forEach((w:any)=> out.push("  - " + (w.username ? "@"+w.username : "tg:"+w.tgId) + " — " + w.prize));
      out.push("");
    }
    await ctx.reply(out.join("\n"));
  });


}
