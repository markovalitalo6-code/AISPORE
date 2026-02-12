## Verify a draw (v1)

1. Get public inputs:
   - week
   - seed
   - entries (or entriesHash)
2. Re-run raffle with the same seed + entries.
3. Compare:
   - winnerUserId
   - totalTickets
4. Fetch locked record:
   - GET /reward/:id or /reward/by-week/:week
5. Result must match exactly.

## How AISPORE v1 works (plain English)

AISPORE v1 is a publicly verifiable, off-chain reward system.

1. Tickets are calculated from public inputs (balances, activity, caps).
2. A raffle is run using a public seed and the ticket set.
3. A winner is selected deterministically from (seed + entries).
4. The result is locked once per week by an admin action.
5. The locked record is immutable and publicly readable.
6. Anyone can recompute the draw and verify the winner.

What v1 does NOT do:
- No staking
- No yield or ROI promises
- No on-chain custody
- No Telegram-triggered payouts


---

Issue #19: Runner test 6
