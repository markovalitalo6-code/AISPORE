# GEMINI AUDIT BRIEF — AISPORE Reward Logic v1
Last updated: 2026-02-10
Scope: reward/incentive logic sanity check (legal/comms risk, game theory abuse, treasury sustainability). No code audit.

## 1) Non-negotiables (LOCKED)
- HOLDING = PARTICIPATION (no staking / no yield / no ROI language).
- Web is the source of truth; Telegram only announces/routes.
- Treasury-first, never drains; no “automatic payout” model.
- Rewards are probabilistic (tickets), rule-based, publicly verifiable.
- Anti-whale + anti-sybil required (pragmatic v1 allowed; hardening later).

## 2) System intent (why)
AISPORE exists to fix the Web3 failure mode:
- passive holding + opaque “rewards”
- whales/bots dominate
- late users become exit liquidity
Goal: motivate long-hold + real participation WITHOUT financial promises.

## 3) Core primitives (v1)
### Tickets (heart of the system)
- Tickets are NOT money. Not transferable. Not redeemable.
- Tickets are probability weight:
  winner ~ random(weighted by tickets)
- Tickets reset/expire per epoch (weekly).

### Participation sources (minimal set)
A) Holding eligibility: wallet must hold >= min_hold to participate.  
B) Holding size (anti-whale): diminishing returns + cap_balance.  
C) Holding duration: tiered multiplier (not linear).  
D) TG Founding Players activity: small weekly bonuses gated by presence.  
E) Referral badges: invite new members -> weekly ticket bonus (capped tiers).  
F) Snake: weekly best score gets a small ticket bonus (e.g., +3; optional top-3 3/2/1).

### Total tickets (per wallet, per week)
total_tickets = holding_tickets + activity_tickets + referral_bonus + snake_bonus  
Constraint: same wallet can win max 1 tier per week.

## 4) Treasury -> weekly reward pool (v1)
RewardPool is a BUDGET CAP, not a promise:
RewardPool = min( Treasury * X%, AbsoluteCap )

- X% small & safe (target 1–3% range).
- AbsoluteCap prevents blow-ups.
- Floor can be 0 (no lock/reward if unsafe).
- Treasury is never “owed” to anyone.

## 5) Reward distribution (v1)
- Multiple winners per week (tiers), not “one whale takes all”.
- Example tiers: 50% / 30% / 20% of RewardPool.
- Draw uses ticket weights; unique winners per tier/week.

## 6) TG + Web roles (why they exist)
- TG Founding Players group = presence gate + activity/referral signal capture.
- Referral badges exist to turn “growth work” into participation probability (not cash).
- Snake exists as activity signal; small bonus only.
- Web displays everything (truth):
  - MC chart (dex), locked results, winners, draw history
  - how tickets were formed (transparency)
All draws + winners displayed on Web; TG only routes/announces.

## 7) MC scaling (high-level expectation)
Rewards scale via Treasury (and optional caps), not via “promised yields”.

## 8) What Gemini must audit (deliverables)
Return:
- RED flags (must fix before implementing)
- YELLOW flags (risk / v2 hardening)
- GREEN confirmations (safe/consistent)
And concrete edits.

### A) Legal/comms risk
- Any phrasing/mechanic that implies yield/ROI?
- RewardPool wording risk (cap vs promise).
- Referral/snake optics: any ponzi signals?
- Safe public messaging template.

### B) Abuse & game theory
- Whale dominance remaining? Is sqrt/log + caps sufficient?
- Referral farming: sybil invites; how to cap/verify?
- Snake exploitation: replay/spoof; anti-cheat minimal v1?
- Dominant axis risk (one source overwhelms others)?

### C) Treasury sustainability
- Is X% range safe? Where should AbsoluteCap sit?
- Any death spiral / cliff risks?
- Should floor=0 be explicit and under what conditions?

### D) Participation dynamics
- Does the model truly reward presence over capital?
- Does it motivate long-hold without financial promises?
- Any perverse incentives?

## 9) Constraints (do not propose)
- No staking/yield/ROI language.
- No “treasury drain” or guaranteed payouts.
- No new systems beyond tickets + controlled reward pool + tiers.
