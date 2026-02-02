import 'dotenv/config'

const BOT  = process.env.BOT_TOKEN
const CHAT = process.env.CHAT_ID
const LANG = (process.env.LANG || 'en').toLowerCase() // 'en' | 'fi'

// Kevyt i18n
function t(key) {
  const en = {
    title: 'AI Spore Awakening Update',
    body:  'We continue to the next phase today.\nGet ready for the evening messages at 18:00 (EET) 🔥'
  }
  const fi = {
    title: 'AI Spore Heräämispäivitys',
    body:  'Jatkamme seuraavaan vaiheeseen tänään.\nValmistautukaa iltaviestien avaukseen klo 18:00 🔥'
  }
  const dict = LANG === 'fi' ? fi : en
  return dict[key]
}

async function send(text) {
  const res = await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT, text, parse_mode: 'HTML' })
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.description)
  return json
}

;(async () => {
  const text = `🌱 <b>${t('title')}</b>\n${t('body')}`
  await send(text)
  console.log(`[daily] sent (${LANG})`)
})().catch(err => {
  console.error('Error:', err?.message || err)
  process.exit(1)
})
