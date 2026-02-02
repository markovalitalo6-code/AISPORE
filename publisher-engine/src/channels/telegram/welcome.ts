import { Bot } from "grammy";
import { ensureUserRecord } from "./referral";
import { ensureBadgesFile } from "./referral.utils";

const GROUP_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";

import type { Context } from "grammy";

// Founding Players group welcome (auto delete)
export async function handleNewGroupMember(ctx: Context) {
  // === AISPORE_GROUP_WELCOME_V1 ===
  try {
    const member = ctx.message?.new_chat_members?.[0];
    if (!member) return;

    const first = member.first_name ?? "";
    const last = member.last_name ?? "";
    const fullName = (first + " " + last).trim();
    const uname = member.username ? `@${member.username}` : "";
    const who = uname || fullName || "new member";

    const text =
      `🍄 Welcome to AISPORE Insiders, ${who}!

` +
      `You’re early — and that matters here.

` +
      `✅ What you get in Founding Players:
` +
      `• early access + future perks
` +
      `• badges + status tracking
` +
      `• reward events tied to real ecosystem growth

` +
      `⚠️ Keep it clean:
` +
      `No spam • no fake invites • no random token shilling.

` +
      `Type /status to see your badge + referral link.`;

    const sent = await ctx.reply(text).catch(() => null);
    if (sent) {
      setTimeout(() => {
        ctx.api.deleteMessage(sent.chat.id, sent.message_id).catch(() => {});
      }, 180_000); // 3 minutes
    }
  } catch (e) {
    console.error("AISPORE_GROUP_WELCOME_V1 failed:", e);
  }
  // === END AISPORE_GROUP_WELCOME_V1 ===
}

