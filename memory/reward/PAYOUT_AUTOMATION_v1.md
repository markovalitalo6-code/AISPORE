# AISPORE — Payout Automation v1 (SOL + TOKEN, on-chain proof)
Last updated: 2026-02-11

## Goal
Automated payouts directly to winners' wallets with public proof on Web (tx signatures + locked record).

## Wallet source of truth (required)
TG hostbot enforces wallet linking:
- user provides wallet address
- user signs a message (Phantom)
- bot verifies signature
Store mapping:
- tgUserId -> walletAddress (verified)

## Reward lock -> payout (pipeline)
1) Reward lock creates immutable off-chain record (already exists):
   - week/epoch or triggerId
   - seed/entriesHash/winner(s)
2) Payout worker reads locked record, builds payout plan:
   - amounts: SOL + TOKEN (small, multiple winners preferred)
3) Worker sends transactions from HOT_WALLET
4) Persist payout receipts:
   - signature(txid), from, to, amount, mint, slot, timestamp
5) Web displays:
   - TG username + short wallet
   - prize amounts (SOL+TOKEN)
   - tx signature link (proof)
   - locked record link (seed/hash)

## Treasury safety
- Treasury wallet = cold storage (no automation).
- Hot wallet = small balance used by automation.
- Enforce caps:
  - MAX_DAILY_EMISSION
  - MAX_WEEKLY_EMISSION
- If caps exceeded -> queue/pause payouts (never drain).

## AI role (watchdog only)
AI may:
- flag suspicious ref farms / sybil clusters
- recommend pause
AI may NOT:
- override caps
- change payout amounts
- bypass eligibility rules

## Required data models (v1)
- users: { tgUserId, tgUsername, wallet, walletVerified, joinedAt }
- referrals: { inviterTgUserId, inviteeTgUserId, status(pending/confirmed), ts }
- rewards_locked: { id, triggerId/week, seed, entriesHash, winners[] }
- payouts: { id, rewardId, winnerTgUserId, toWallet, mint, amount, signature, status, ts }
