# ACTIVE_CONTEXT (SHORT)

Working now:
- Wallet link/verify works (challenge → Phantom sign → link OK).
- Event ledger append + public read works (/events/:type).
- Engine hybrid-check works with tiers + idempotency; produces draw + payout events.
- Treasury caps/ledger fields appear in draw/payout (treasuryBefore/After, caps).
- Public feed works: GET /public/feed?week=YYYY-W## returns latestTreasury, latestDraw, draws, pendingPayouts.
- Web draw page reads /api/public/feed and can display latest draw + payouts.

Unfinished:
- Devnet real payout execution flow (replace placeholder txid with real devnet tx).
- Clean up old test events / week data (optional, later).
- UI polish (later; graphics/sound later).

Known issues:
- API rate limit 5/10s can cause HTTP 429 if spamming refresh.
- There are non-doc code changes in working tree; do not commit them in docs push.

Immediate next task:
- Push SSOT memory docs only (OJ_START_HERE, PROJECT_MAP, ACTIVE_CONTEXT, decisions append).
