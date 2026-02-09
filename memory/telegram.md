# Telegram → AISPORE (Plan, not implemented)

Last updated: 2026-02-09

## Purpose
Telegram is the primary community entry point. It must produce verifiable events that feed the Web/API source-of-truth.

## Core flows (future)
1) Referral join
- User joins TG via invite/ref link/code
- TG bot captures: {tgUserId, tgChatId, refCode, joinedAt}
- Bot calls API: POST /events (future) with signed admin/bot key
- API stores event → updates referral state (anti-ring rules later)

2) Badges / tiers (future)
- Badge eligibility is computed in API (wallet-based), not inside TG
- TG only displays current badge/tier from API read endpoint

3) Snake winners (future)
- Snake runs on web (source of truth)
- Web posts results to API (winner event)
- TG announces winners by reading API “latest events” feed

## Rules (non-negotiable)
- TG never triggers payouts directly
- TG may trigger *requests* (e.g., “show my status”), but API decides
- All write actions must be authenticated (bot/admin key)
- API keeps append-only event log for dispute/audit

## Minimum integration (when we implement)
- Bot → API: signed POST event (join/ref, command usage, announcements)
- API → TG: read latest events, post announcements
