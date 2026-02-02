require('dotenv').config();

console.log('\n=== ENV CHECK ===\n');

console.log({
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  X_API_KEY: process.env.X_API_KEY,
  X_API_SECRET: process.env.X_API_SECRET,
  X_ACCESS_TOKEN: process.env.X_ACCESS_TOKEN,
  X_ACCESS_TOKEN_SECRET: process.env.X_ACCESS_TOKEN_SECRET,
});

