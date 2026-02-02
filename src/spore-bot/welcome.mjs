import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { readFileSync, createReadStream } from 'fs';

const bot = new Telegraf(process.env.BOT_TOKEN, { handlerTimeout: 9000 });

bot.telegram.getMe()
  .then(m => console.log(new Date().toISOString()+': getMe ok', m.username))
  .catch(e => console.error('getMe err', e?.response?.description || e?.message));

const lastCallByChat = new Map();
bot.use((ctx, next) => {
  try {
    const cid = ctx.chat?.id ?? 'na';
    const uid = ctx.from?.id ?? 'na';
    const key = cid + ':' + uid;
    const now = Date.now();
    const prev = lastCallByChat.get(key) || 0;
    if (now - prev < 300) return;
    lastCallByChat.set(key, now);
  } catch {}
  return next();
});

bot.on('message', async (ctx, next) => {
  try {
    console.log(
      new Date().toISOString()+':',
      'message from', ctx.from?.id,
      'chat', ctx.chat?.id,
      'text', ctx.message?.text,
      'thread', ctx.message?.message_thread_id
    );
  } catch {}
  return next();
});

const withThread = (ctx, extra = {}) => {
  const thread = ctx.message?.message_thread_id;
  if (thread) extra.message_thread_id = thread;
  return extra;
};

bot.command('ping', (ctx) => {
  return ctx.reply('pong ' + new Date().toISOString(), withThread(ctx));
});

bot.command('id', (ctx) => {
  return ctx.reply('from ' + (ctx.from?.id) + ' chat ' + (ctx.chat?.id), withThread(ctx));
});

bot.command('badgebuf', async (ctx) => {
  try {
    const buf = readFileSync('assets/badges/welcome_badge_final.png');
    const nick = ctx.from?.username || ('user_' + ctx.from?.id);
    await ctx.replyWithPhoto(
      { source: buf, filename: 'welcome_badge.png' },
      withThread(ctx, { caption: '@' + nick + ' Welcome Badge' })
    );
    console.log('/badgebuf sent');
  } catch (e) {
    console.error('/badgebuf err', e?.response?.description || e?.message);
  }
});

bot.command('badgepath', async (ctx) => {
  try {
    const nick = ctx.from?.username || ('user_' + ctx.from?.id);
    await ctx.replyWithPhoto(
      'assets/badges/welcome_badge_final.png',
      withThread(ctx, { caption: '@' + nick + ' Welcome Badge (path)' })
    );
    console.log('/badgepath sent');
  } catch (e) {
    console.error('/badgepath err', e?.response?.description || e?.message);
  }
});

bot.command('badgestream', async (ctx) => {
  try {
    const nick = ctx.from?.username || ('user_' + ctx.from?.id);
    await ctx.replyWithPhoto(
      { source: createReadStream('assets/badges/welcome_badge_final.png') },
      withThread(ctx, { caption: '@' + nick + ' Welcome Badge (stream)' })
    );
    console.log('/badgestream sent');
  } catch (e) {
    console.error('/badgestream err', e?.response?.description || e?.message);
  }
});

bot.launch({
  dropPendingUpdates: true,
  allowedUpdates: ['message','callback_query','chat_member','my_chat_member']
});
