import 'dotenv/config';
const BOT = process.env.BOT_TOKEN;
const CHAT = process.env.CHAT_ID;
const text = `🌱 <b>AI Spore Daily</b>
Today we continue the awakening. Evening drops at 18:00 (EET) 🔥`;
const res = await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ chat_id: CHAT, text, parse_mode: 'HTML' })
});
const json = await res.json();
if (!json.ok) {
  console.error('Send failed:', json);
  process.exit(1);
}
console.log('Daily sent:', json.result?.message_id || '?');
process.exit(0);
