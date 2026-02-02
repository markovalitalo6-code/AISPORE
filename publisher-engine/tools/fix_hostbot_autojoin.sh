#!/usr/bin/env bash
set -euo pipefail

FILE="src/channels/telegram/handler.ts"
[ -f "$FILE" ] || { echo "FATAL: missing $FILE"; exit 2; }

INVITE_LINK="https://t.co/VopXfjhqIe"
TS="$(date +%Y%m%d-%H%M%S)"

cp -a "$FILE" "$FILE.BAK.$TS"

python3 - <<'PY'
import re
from pathlib import Path

INVITE = "https://t.co/VopXfjhqIe"

p = Path("src/channels/telegram/handler.ts")
s = p.read_text(encoding="utf-8")

# 1) Ensure Markup import
if "Markup" not in s:
    s = re.sub(
        r'import\s*\{\s*Telegraf\s*\}\s*from\s*"telegraf"\s*;',
        'import { Telegraf, Markup } from "telegraf";',
        s
    )

# 2) Add helper once
if "AISPORE_AUTOJOIN_HELPER" not in s:
    helper = f'''
// === AISPORE_AUTOJOIN_HELPER ===
function aisporeJoinKeyboard() {{
  // @ts-ignore
  return Markup.inlineKeyboard([
    Markup.button.url("🚪 Join Founding Players", "{INVITE}")
  ]);
}}
// === END AISPORE_AUTOJOIN_HELPER ===
'''
    insert_at = s.find("\n\n")
    s = s[:insert_at] + helper + s[insert_at:]

# 3) Inject auto-join reply AFTER first ctx.reply inside bot.start
m = re.search(r'bot\.start\s*\(\s*async\s*\(ctx\)\s*=>\s*\{', s)
if not m:
    raise SystemExit("bot.start not found")

start_i = m.end()
m2 = re.search(r'await\s+ctx\.reply\s*\([\s\S]*?\);\s*', s[start_i:])
if not m2:
    raise SystemExit("No ctx.reply inside bot.start")

inject_at = start_i + m2.end()

snippet = '''
    // === AUTO JOIN AFTER START (NO MANUAL STEPS) ===
    await ctx.reply(
      "✅ Access verified. Welcome to AISPORE.",
      aisporeJoinKeyboard()
    );
'''

if "AUTO JOIN AFTER START" not in s:
    s = s[:inject_at] + snippet + s[inject_at:]

p.write_text(s, encoding="utf-8")
print("OK: HostBot auto-join patched")
PY

pnpm -s build
pm2 restart AISPORE_HOSTBOT --update-env >/dev/null

echo "DONE ✅"
echo "Flow now:"
echo "Referral → HostBot → /start → Join Founding Players button → Group"
