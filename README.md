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

