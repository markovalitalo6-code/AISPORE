import { Bot } from "grammy";
import { setupTelegramBot } from "../channels/telegram/handler";
import dotenv from "dotenv";

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;



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
