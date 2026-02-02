#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.." || exit 1

JOIN_URL_DEFAULT="https://t.co/VopXfjhqIe"
JOIN_URL="${JOIN_URL:-$JOIN_URL_DEFAULT}"

TS="$(date +%Y%m%d-%H%M%S)"
FILE="src/channels/telegram/handler.ts"
[ -f "$FILE" ] || { echo "ERR: missing $FILE"; exit 1; }

cp -a "$FILE" "$FILE.BAK.$TS"

python3 - <<PY
from pathlib import Path
import re

p = Path("$FILE")
s = p.read_text(encoding="utf-8")

JOIN_URL = "${JOIN_URL}"

# 1) Ensure Markup import exists (grammy)
# Handles: import { Bot } from "grammy";
# Or:      import { Bot, InlineKeyboard } from "grammy";
m = re.search(r'import\s*\{\s*([^}]+)\s*\}\s*from\s*"grammy";', s)
if not m:
    raise SystemExit("PATCH FAIL: could not find grammy import in handler.ts")

items = [x.strip() for x in m.group(1).split(",")]
if "Markup" not in items:
    items.append("Markup")
new_import = 'import { ' + ", ".join(items) + ' } from "grammy";'
s = s[:m.start()] + new_import + s[m.end():]

# 2) Insert/Update Welcome Pack constants + builder
WELCOME_MARK = "=== AISPORE_WELCOME_PACK_V1 ==="
welcome_block = f'''
// {WELCOME_MARK}
// NOTE: Keep this copy stable; adjust later in one place only.
const AISPORE_JOIN_URL = "{JOIN_URL}";

function aisporeWelcomePackText() {{
  return (
    "🍄 Welcome to **AISPORE Founding Players**\\n" +
    "You’ve just entered the *pre-launch layer* of a system we’re building to last. 🧠⚙️\\n\\n" +

    "✅ **What this is**\\n" +
    "AISPORE is not ‘just a Telegram group’. It’s a community + token + reward ecosystem where:\\n" +
    "• real builders & early supporters get recognized\\n" +
    "• growth is encouraged (but spam is punished)\\n" +
    "• rewards evolve as the ecosystem evolves\\n\\n" +

    "💎 **Why you should care**\\n" +
    "Being early matters. Founding Players are the first layer of the network — and the system is designed to reward *aligned* people over time.\\n\\n" +

    "🧬 **How rewards work (kept intentionally flexible)**\\n" +
    "We will reward actions that strengthen AISPORE, such as:\\n" +
    "• bringing in quality new members\\n" +
    "• staying active & contributing\\n" +
    "• holding the AISPORE token\\n\\n" +
    "⚠️ We do **not** promise fixed numbers yet (tickets per invite, exact prize sizes, etc.).\\n" +
    "That’s on purpose — it keeps the system healthy and prevents abuse.\\n\\n" +

    "🪙 **Token requirement (important)**\\n" +
    "To participate in draws / premium rewards, you’ll need to hold AISPORE tokens.\\n" +
    "People who never hold the token are not the target for this system.\\n\\n" +

    "📈 **Bigger ecosystem = bigger potential**\\n" +
    "As the community + token utility + market cap grows, the *reward potential* grows too.\\n" +
    "Higher momentum → stronger ecosystem → more room for rewards. 🚀\\n\\n" +

    "🏷️ **Badges**\\n" +
    "Badges are a simple way to show contribution level.\\n" +
    "They’ll evolve over time and may unlock perks (when activated).\\n\\n" +

    "🧯 **Rules (short & strict)**\\n" +
    "• No spam / no fake accounts\\n" +
    "• No abuse of invites\\n" +
    "• Be respectful — we protect the community\\n" +
    "• We reserve the right to adjust rules to keep things fair\\n\\n" +

    "👇 **Next step**\\n" +
    "Tap the button below to join the Founding Players group."
  );
}}
'''

if WELCOME_MARK not in s:
    # Put block near the top (after imports)
    imp_end = 0
    last_imp = None
    for mm in re.finditer(r'^\s*import .*?;\s*$', s, flags=re.M):
        last_imp = mm
    if last_imp:
        imp_end = last_imp.end()
    s = s[:imp_end] + "\n" + welcome_block + "\n" + s[imp_end:]
else:
    # Update JOIN URL if block exists
    s = re.sub(r'const\s+AISPORE_JOIN_URL\s*=\s*".*?";',
               f'const AISPORE_JOIN_URL = "{JOIN_URL}";', s)

# 3) Patch /start handler: after it runs, send Welcome Pack + Join button
# We look for bot.command("start", async (ctx) => { ... });
start_pat = r'bot\.command\(\s*["\']start["\']\s*,\s*async\s*\(\s*ctx\s*\)\s*=>\s*\{'
m2 = re.search(start_pat, s)
if not m2:
    raise SystemExit("PATCH FAIL: bot.command('start', async (ctx) => { ... }) not found in handler.ts")

# Find end of that handler block (naive brace matching from first "{")
i = m2.end() - 1
depth = 0
end = None
for k in range(i, len(s)):
    ch = s[k]
    if ch == "{":
        depth += 1
    elif ch == "}":
        depth -= 1
        if depth == 0:
            # should be the closing brace of handler function body
            end = k
            break
if end is None:
    raise SystemExit("PATCH FAIL: could not brace-match /start handler")

body = s[i+1:end]

INJECT_MARK = "AISPORE_WELCOME_PACK_SEND_V1"
inject = f'''
    // {INJECT_MARK}
    try {{
      const text = aisporeWelcomePackText();
      await ctx.reply(text, {{
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard([
          Markup.button.url("🚀 Join Founding Players", AISPORE_JOIN_URL)
        ]).reply_markup
      }});
    }} catch (e) {{
      console.error("welcome pack send failed:", e);
    }}
'''

if INJECT_MARK not in body:
    # Insert near the end of handler (before closing)
    body = body.rstrip() + "\n" + inject + "\n"

s = s[:i+1] + body + s[end:]

p.write_text(s, encoding="utf-8")
print("OK: patched HostBot /start welcome pack + join button")
PY

echo "Building..."
pnpm -s build

echo "Restarting PM2..."
pm2 restart AISPORE_HOSTBOT --update-env

echo
echo "DONE ✅"
echo "Test flow:"
echo "1) Open @AISporeHostBot"
echo "2) Type /start (or use a referral deep-link)"
echo "3) You should receive the Welcome Pack + a 🚀 Join Founding Players button"
