# AISPORE — PROJECT (BIG PICTURE)

Last updated: 2026-02-09

## Goal
Ship a runnable v1 skeleton: ticket calc -> raffle -> reward lock -> readback.
Telegram integration later, only after core loop is stable and audited.

## Components
- src/api: API layer (business logic, store, routes)
- web/ai-spore-site: Next UI with /api rewrite to API
- src/spore-bot: Telegram bot exists, untouched in this phase

## Security posture (v1)
- Public read-only endpoints ok
- All state-changing ops require admin key
- Public verifiability: store seed + entriesHash + winnerUserId

## What “done” means for v1
- Anyone can reproduce draw result from public inputs
- Lock is immutable (append-only) and readable by id and by week
- UI can perform full flow locally without manual curl
## Next phase gates (post-v1)

Telegram integration GO only if:
- v1 runnable skeleton is frozen and tagged
- admin-gating and idempotency verified
- public verification documented

On-chain / VRF GO only if:
- off-chain v1 runs stable for >= N weeks
- no replay or determinism issues observed
- explicit scope doc approved

