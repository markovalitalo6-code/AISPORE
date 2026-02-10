# AISPORE — STATE (NOW)

Last updated: 2026-02-09
Maintainer: Marko
Orchestrator: OJ

## What works (confirmed)
- Weekly lock idempotency verified (2026-W09):
  - run twice same week => same id/hash/winner
  - different SEED env var does NOT change locked week (returns existing record)

- API (Express + ts-node) runs on **:3100**
- WEB (Next.js ai-spore-site) runs on **:3000**
- Next rewrite in web proxies **/api/* -> http://localhost:3100/***
- api-test UI works:
  - Ping Health -> OK
  - Calc Tickets -> OK
  - Raffle run -> OK
  - Reward lock (ADMIN) -> OK with x-admin-key=dev_admin
  - Get by-week WEEK_UI -> OK after lock

## Current trust model (v1)
- Off-chain lock record (append-only) + public readback
- Admin-only write for reward lock
- Public read endpoints allowed

## How to run (2 terminals)
### Terminal A — API
cd "$HOME/hub/AI-WorkSpace/01_projects/ai-spore/src/api" && ADMIN_KEY=dev_admin PORT=3100 pnpm run dev

### Terminal B — WEB
cd "$HOME/hub/AI-WorkSpace/01_projects/ai-spore/web/ai-spore-site" && PORT=3000 npm run dev

## Next single thread
1) Ensure admin gating is correct (lock requires admin key, public reads ok)
2) Keep weekly lock script stable (creates lock + readback by id/week)
3) Commit + push frequently (small diffs, always SSOT updated)
## v1 verification status

- Step 1: Admin gating — VERIFIED
  - reward lock requires x-admin-key
  - readback endpoints are public

- Step 2: Weekly lock idempotency — VERIFIED
  - same week cannot create duplicate locks
  - deterministic result (same id, entriesHash, winnerUserId)

- Step 3: UI full-flow — VERIFIED
  - api-test UI completes full loop:
    ticket calc → raffle → reward lock → readback


## Step 1: Admin gating + public readback — VERIFIED (manual curl)

Verified on: 2026-02-10

- POST /reward/lock without admin key => 401 Unauthorized ✅
- POST /reward/lock with x-admin-key => 200 + locked record ✅
- GET /reward/:id (public) => 200 + same record ✅
- GET /reward/by-week/:week (public) => 200 + same record ✅

Proof sample (week 2026-WXX):
- id: 3d1c92a890a5563561d3811d
- entriesHash: 21dcd949ffb3f784732f006e307592b81b52c5fa95043175761ae9cfc622fbd7
- winnerUserId: u1
