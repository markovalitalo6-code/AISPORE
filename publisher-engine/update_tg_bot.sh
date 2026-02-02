#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$HOME/hub/AI-WorkSpace/01_projects/ai-spore/publisher-engine"
cd "$PROJECT_ROOT"

mkdir -p src/channels/telegram
mkdir -p src/data

cat << 'EOF' > src/channels/telegram/referral.utils.ts
import path from "path";
import { promises as fs } from "fs";

type BadgesStore = Record<string, any>;

const DATA_DIR = path.resolve(process.cwd(), "src", "data");
const BADGES_PATH = path.resolve(DATA_DIR, "badges.json");

export async function ensureBadgesFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(BADGES_PATH);
  } catch {
    await fs.writeFile(BADGES_PATH, JSON.stringify({}), "utf8");
  }
}

export async function readBadges(): Promise<BadgesStore> {
  try {
    const content = await fs.readFile(BADGES_PATH, "utf8");
    return JSON.parse(content) as BadgesStore;
  } catch {
    return {};
  }
}

export async function writeBadges(data: BadgesStore): Promise<void> {
  await fs.writeFile(BADGES_PATH, JSON.stringify(data, null, 2), "utf8");
}
EOF

cat << 'EOF' > src/channels/telegram/referral.ts
import { readBadges, writeBadges } from "./referral.utils";

export interface BadgeRecord {
  userId: number;
  username?: string;
  refCode: string;
  invites: number;
  joinedAt: string;
  badgeLevel: "Bronze" | "Silver" | "Gold" | "Diamond";
}

function computeBadge(invites: number): BadgeRecord["badgeLevel"] {
  if (invites >= 20) return "Diamond";
  if (invites >= 8) return "Gold";
  if (invites >= 3) return "Silver";
  return "Bronze";
}

export async function onReferralUsed(inviterUserId: number) {
  const all = await readBadges();
  const inviter = all[inviterUserId];
  if (inviter) {
    inviter.invites = (inviter.invites ?? 0) + 1;
    inviter.badgeLevel = computeBadge(inviter.invites);
    all[inviterUserId] = inviter;
  }
  await writeBadges(all);
  console.log("Referral update: user", inviterUserId, "invites:", inviter?.invites, "badge:", inviter?.badgeLevel);
}

export async function ensureUserRecord(userId: number, username?: string): Promise<BadgeRecord> {
  const all = await readBadges();
  let rec = all[userId];
  if (!rec) {
    const refCode = `ref_${userId}_${Math.random().toString(36).slice(2, 9)}`;
    rec = {
      userId,
      username,
      refCode,
      invites: 0,
      joinedAt: new Date().toISOString(),
      badgeLevel: "Bronze",
    };
    all[userId] = rec;
    await writeBadges(all);
  }
  if (!rec.refCode) rec.refCode = `ref_${userId}_${Math.random().toString(36).slice(2, 9)}`;
  if (typeof rec.invites !== "number") rec.invites = 0;
  if (!rec.badgeLevel) rec.badgeLevel = computeBadge(rec.invites);
  await writeBadges(all);
  return rec;
}

export async function getUserBadgeRecord(userId: number): Promise<BadgeRecord | undefined> {
  const all = await readBadges();
  return all[userId] as BadgeRecord | undefined;
}

export async function saveUserBadgeRecord(rec: BadgeRecord): Promise<void> {
  const all = await readBadges();
  all[rec.userId] = rec;
  await writeBadges(all);
}
EOF

cat << 'EOF' > src/channels/telegram/welcome.ts
import { Bot } from "grammy";
import { ensureUserRecord } from "./referral";
import { ensureBadgesFile } from "./referral.utils";

const GROUP_CHAT_ID = process.env.TG_FOUNDING_PLAYERS_GROUP_ID ?? "";

export async function handleNewGroupMember(bot: Bot, memberUserId: number, memberUsername?: string, memberFirstName?: string) {
  try {
    const welcomeText = `🍄 Welcome to AISPORE | Founding Players!
You now belong to the earliest core group before launch.
Hold your position — holders and early members will get advantages in future phases.
Your personal referral link has just been sent to your DM.

Let's build the strongest AI-driven meme ecosystem on Solana. 🚀`;

    try {
      await bot.api.sendMessage(GROUP_CHAT_ID, welcomeText);
    } catch (e) {
      console.error("Failed to post welcome message in group:", e);
    }

    await ensureBadgesFile();

    const record = await ensureUserRecord(memberUserId, memberUsername ?? "");

    const dmText = `Welcome to AISPORE Founding Players 🍄

Here is your personal invite link:
https://t.me/AISporeFoundingPlayers?start=${record.refCode}

🔹 Each person who joins through your link increases your badge level
🔹 Higher badge = better rewards in future events
🔹 Just share your link with people who actually care about crypto & AI

Stay active in the group and hold — early holders get the biggest long-term advantages. 🚀`;

    try {
      await bot.api.sendMessage(memberUserId, dmText);
    } catch (e) {
      console.error("Failed to send DM with referral link:", e);
    }

  } catch (err) {
    console.error("Error in welcome flow for user", memberUserId, err);
  }
}
EOF

cat << 'EOF' > src/channels/telegram/handler.ts
import { Bot, Context } from "grammy";
import { handleNewGroupMember } from "./welcome";
import { getUserBadgeRecord, onReferralUsed, ensureUserRecord } from "./referral";
import { readBadges } from "./referral.utils";

export function setupTelegramBot(bot: Bot) {
  bot.on("new_chat_members", async (ctx: Context) => {
    try {
      const newMembers = ctx.update?.message?.new_chat_members;
      if (!newMembers || !Array.isArray(newMembers)) return;

      const chatId = ctx.chat?.id;
      const FOUNDING_GROUP_ID = process.env.TG_FOUNDING_PLAYERS_GROUP_ID;
      if (chatId && FOUNDING_GROUP_ID && String(chatId) === String(FOUNDING_GROUP_ID)) {
        for (const member of newMembers) {
          const userId = member.id;
          const username = member.username ?? member.first_name ?? "";
          await handleNewGroupMember(bot, userId, username);
        }
      }
    } catch (e) {
      console.error("Error handling new group member:", e);
    }
  });

  bot.command("ref", async (ctx) => {
    try {
      const from = ctx.from;
      if (!from) {
        await ctx.reply("Unable to determine user.");
        return;
      }
      const userId = Number(from.id);
      const rec = await getUserBadgeRecord(userId);
      if (!rec) {
        await ctx.reply("No referral data found for you yet. Join the group to initialize.");
        return;
      }

      const response = `RefCode: ${rec.refCode}
Link: https://t.me/AISporeFoundingPlayers?start=${rec.refCode}
Badge: ${rec.badgeLevel}
Invites: ${rec.invites}`;

      if (ctx.chat?.type === "private") {
        await ctx.reply(response);
      } else {
        await ctx.api.sendMessage(userId, response);
        await ctx.reply("Sent your referral info in a private chat.");
      }
    } catch (e) {
      console.error("Error handling /ref:", e);
      await ctx.reply("An error occurred while retrieving your referral info.");
    }
  });

  bot.command("start", async (ctx) => {
    const payload = ctx.match || "";
    const refCode = String(payload).trim();
    try {
      const all = await readBadges();
      const inviter = Object.values(all).find((r: any) => r.refCode === refCode);
      if (inviter) {
        await onReferralUsed(inviter.userId);
      }

      const newUserId = ctx.from?.id;
      if (newUserId) {
        await ensureUserRecord(newUserId, ctx.from?.username ?? ctx.from?.first_name);
      }

      await ctx.reply("Welcome to AISPORE! Your onboarding is in progress. Join the Founding Players group to see the welcome and your referral link in DM.");
    } catch (e) {
      console.error("Error handling start payload:", e);
    }
  });
}
EOF

cat << 'EOF' > src/data/badges.json
{}
EOF

cat << 'EOF' > src/cli/tgBot.ts
import { Bot } from "grammy";
import { setupTelegramBot } from "../channels/telegram/handler";
import dotenv from "dotenv";

dotenv.config();

const BOT_TOKEN = process.env.TG_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("Error: TG_BOT_TOKEN not found in environment variables");
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

setupTelegramBot(bot);

bot.start({
  onStart: (botInfo) => {
    console.log(`AISPORE Telegram Bot started: @${botInfo.username}`);
    console.log("Listening for new members and commands...");
  },
});

process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());
EOF

pnpm add grammy dotenv

pnpm build

echo ""
echo "✅ AISPORE Telegram Bot V2 upgrade complete!"
echo ""
echo "To start the bot, run:"
echo "  node dist/cli/tgBot.js"
echo ""

