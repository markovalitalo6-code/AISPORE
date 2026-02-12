## Verify a draw (v1)

1. Obtain public inputs:
   - week
   - seed
   - entries (or entriesHash)
2. Re-run the raffle using the same seed and entries.
3. Compare:
   - winnerUserId
   - totalTickets
4. Retrieve the locked record:
   - GET /reward/:id or /reward/by-week/:week
5. The result must match exactly.

## How AISPORE v1 works (plain English)

AISPORE v1 is a publicly verifiable, off-chain reward system.

1. Tickets are calculated from public inputs (balances, activity, caps).
2. A raffle is conducted using a public seed and the ticket set.
3. A winner is deterministically selected from (seed + entries).
4. The result is locked once per week through an admin action.
5. The locked record is immutable and publicly accessible.
6. Anyone can recompute the draw and verify the winner.

What v1 does NOT do:
- No staking
- No yield or ROI promises
- No on-chain custody
- No Telegram-triggered payouts

---

Issue #11: Runner test 1

Just print this issue. No code changes

Constraints:
- Follow repository SSOT rules.
- Do not modify memory/* or build/specs/*LOCKED*.
- If task is unclear, make the smallest safe improvement.
