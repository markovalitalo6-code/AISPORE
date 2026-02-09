# Telegram Integration (PLAN ONLY — NO IMPLEMENTATION YET)

Last updated: 2026-02-09
Owner: Marko
Orchestrator: OJ

## Purpose
Telegram is the primary community entrypoint and UX layer.
It MUST NOT be the system of record for rewards/tickets/badges — it only emits events and displays outcomes.

## Trust Boundary (non-negotiable)
- Telegram bot = UI + event source (ingest)
- API = business logic + validation + append-only event log + derived state
- Web = read-only views + admin tools (later)

## What must be preserved (future requirements)
### A) Referral flow (critical)
- New users join TG via ref link/code
- Bot captures: refCode, tgUserId, joinTimestamp (+ optionally wallet later)
- Bot sends event to API (ingest), API validates + records + updates derived referral stats

### B) Badges (planned)
- Badges are derived from verified events (not manual TG claims)
- Badge award MUST be computed in API, not in bot handlers
- Bot only shows badge status + announcements

### C) Snake (planned)
- Snake runs on web (or controlled environment), produces gameResult events
- TG may trigger “Play Snake” links and show leaderboards
- Score submission must be validated (anti-cheat gates later)

## Data model (minimum planned events)
(Names are placeholders; actual routes decided later)
- referral.join: { refCode, tgUserId, chatId, ts }
- referral.bindWallet: { tgUserId, walletPublicKey, ts }  (optional later)
- game.result.snake: { userId/wallet, score, sessionId, ts }
- badge.award: { userId/wallet, badgeId, reason, ts } (computed by API)

## Anti-abuse expectations (planned)
- Rate limit ingest events per tgUserId/chatId
- Idempotency keys for join events (no double counting)
- No ticket issuance from raw chat spam
- Referral rings capped + activeRefs rules enforced in API

## Implementation order (when time comes)
1) Define ingest endpoints (POST /events/...)
2) Add append-only event log + idempotency at storage layer
3) Add derived state reducers (ref stats, badge state, game stats)
4) Wire TG bot to emit events only (no core logic in bot)
5) Web reads from API; TG shows announcements/links

