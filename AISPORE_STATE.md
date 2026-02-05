# AISPORE – SINGLE SOURCE OF TRUTH (SSOT)

Last updated: 2026-02-05
Maintainer: Marko
Orchestrator: OJ

---

## 1) CURRENT STATUS (READ THIS FIRST)

- Mode: v1 runnable skeleton (48h build mode)
- A/B/C track: IMPLEMENTED + TESTED (API + Web wiring)
- API: Express + ts-node running on port 3100
- Web: Next.js (ai-spore-site) running on port 3000
- Telegram bot: EXISTS in src/spore-bot (NOT modified in this session)

---

## 2) LOCKED NON-NEGOTIABLES (DO NOT CHANGE)

- HOLDING = PARTICIPATION (no staking, no ROI/yield language)
- Treasury-first (never drain)
- Ticket-based probabilistic rewards
- Anti-whale + anti-sybil + anti-bot principles enforced
- “Plankton tier” must always exist
- Source of truth for locked spec:
  - llmao/memory/canon.md
  - llmao/memory/decisions.md
  - llmao/memory/project.md
  - llmao/memory/HANDOFF_STATE_v1.md
  - llmao/build/specs/C_v1_LOCKED_2026-02-03T17-33-11Z.md
  - llmao/build/specs/A_F_v1_LOCKED_2026-02-03T19-14-27Z.md
  - llmao/build/specs/C_v1_fixed.md (ticket formula + tiers + raffle params)

---

## 3) IMPLEMENTED (WHAT WORKS NOW)

### API (src/api)
- Health:
  - GET /health  → {"ok":true}
  - GET /whoami  → {"service":"AISPORE_API","router":"readonly",...}
- Tickets:
  - POST /calc/tickets
    body: { userAvgTokens7d, games7d, activeRefs, tierMinTokens, baseTickets, bronzeMinTokens }
    returns: { eligible, tickets, breakdown }
- Raffle:
  - POST /raffle/run
    body: { seed, entries:[{userId,tickets}] }
    returns: { winnerUserId, totalTickets }
- Reward lock:
  - POST /reward/lock
    body: { week, seed, entries, winnerUserId, totalTickets }
    returns locked reward object {id,...,locked:true}

### Weekly lock script
- scripts/run_weekly_lock.ts
- Runs successfully when API is on 3100
- Output confirmed:
  "=== WEEKLY LOCK DONE ===" + locked reward JSON

### Web (web/ai-spore-site)
- Dev server: http://localhost:3000
- next.config.ts includes rewrite:
  /api/:path* → http://localhost:3100/:path*
- api-test page:
  /api-test shows buttons:
  - Ping Health (calls /api/health)
  - Calc Tickets (calls /api/calc/tickets)

---

## 4) ACTIVE PORTS (EXPECTED)

- API: 3100
- Web: 3000
- NOTE: If ports conflict → stop old node/next processes before restart.

---

## 5) HOW TO START (STANDARD RUNBOOK)

### Terminal A — API
cd "$HOME/hub/AI-WorkSpace/01_projects/ai-spore/src/api" && PORT=3100 pnpm run dev

### Terminal B — WEB
cd "$HOME/hub/AI-WorkSpace/01_projects/ai-spore/web/ai-spore-site" && PORT=3000 npm run dev

---

## 6) NEXT WORK (QUEUE — DO NOT SPLIT)

1) Add GET /reward/:id route (read locked reward)
2) Wire api-test UI to call /api/reward/:id after lock
3) Keep Telegram bot untouched until A/B/C is stable + committed
4) Prepare GitHub repo hygiene (ignore secrets, ignore runtime data, keep specs separate if needed)

---

## 7) CHANGE LOG

### 2026-02-05
- API read-only router stable (health, whoami, calc tickets, raffle/run)
- Reward lock endpoint works (POST /reward/lock)
- Weekly lock script works (scripts/run_weekly_lock.ts)
- Next.js rewrite set (next.config.ts)
- /api-test UI works with buttons

