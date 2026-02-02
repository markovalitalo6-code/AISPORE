import { Bot } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");

const bot = new Bot(token);

bot.command("start", async (ctx) => {
  console.log("START RECEIVED chatId=", ctx.chat?.id, "type=", ctx.chat?.type);
  await ctx.reply("✅ START OK");
});

bot.command("ping", async (ctx) => {
  console.log("PING RECEIVED chatId=", ctx.chat?.id);
  await ctx.reply("pong ✅");
});

bot.on("message:text", async (ctx) => {
  console.log("TEXT:", ctx.message.text);
});

console.log("BOT STARTING…");
bot.start();
