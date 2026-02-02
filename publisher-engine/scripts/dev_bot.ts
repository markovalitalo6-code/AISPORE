import 'dotenv/config';
import { Bot } from "grammy";
import { setupTelegramBot } from "../src/channels/telegram/handler";

const token =
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.BOT_TOKEN ||
  process.env.TELEGRAM_TOKEN;

if (!token) {
  console.error("Missing TELEGRAM_BOT_TOKEN (or BOT_TOKEN / TELEGRAM_TOKEN) in .env");
  process.exit(1);
}

const bot = new Bot(token);
setupTelegramBot(bot);
bot.use(async (ctx, next) => {
  const t = ctx.message?.text;
  if (t) console.log("[IN]", ctx.chat?.type, ctx.chat?.id, t);
  await next();
});

bot.catch((err) => {
  console.error("BOT_ERR", err);
});
process.on("unhandledRejection", (r) => {
  console.error("UNHANDLED_REJECTION", r);
});
process.on("uncaughtException", (e) => {
  console.error("UNCAUGHT_EXCEPTION", e);
});

bot.start({
  onStart: (me) => {
    console.log("Telegram bot running as @" + me.username + " (id=" + me.id + ")");
  }
});
