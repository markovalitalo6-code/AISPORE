# AISPORE — DECISIONS (LOCKED)

Last updated: 2026-02-09

## Non-negotiables
- HOLDING = PARTICIPATION (no staking, no yield/ROI language)
- Web is source of truth; Telegram bots only announce/route
- Treasury-first, never drains
- Probabilistic ticket-based rewards
- Anti-whale + anti-sybil protections required (pragmatic v1 allowed, hardening later)

## v1 implementation decisions
- v1 reward lock is OFF-CHAIN (db/store record) but PUBLICLY VERIFIABLE
- Winner selection must be reproducible from (seed + entries)
- Locked records are append-only; do not overwrite
- Idempotency: one lock per week (second attempt returns existing or rejects)
- Admin write operations require ADMIN_KEY header (x-admin-key)

## Repo discipline
- No secrets committed (.env*, keys)
- Runtime artifacts ignored (events.jsonl, canon.json, .next, node_modules)
- SSOT docs live in repo and are updated as work progresses
