import crypto from "crypto";

export interface RaffleEntry {
  userId: string;
  tickets: number; // must be >= 0
}

export interface RaffleResult {
  winnerUserId: string | null;
  totalTickets: number;
}

/**
 * Deterministic weekly raffle stub.
 * - No side effects
 * - Uses seed for deterministic selection (testable)
 */
export function runWeeklyRaffle(entries: RaffleEntry[], seed: string): RaffleResult {
  const cleaned = entries
    .map(e => ({ userId: e.userId, tickets: Math.max(0, Math.floor(e.tickets)) }))
    .filter(e => e.tickets > 0);

  const totalTickets = cleaned.reduce((sum, e) => sum + e.tickets, 0);
  if (totalTickets === 0) return { winnerUserId: null, totalTickets: 0 };

  // Deterministic "random" number from seed: 0..totalTickets-1
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  const big = BigInt("0x" + hash);
  const pick = Number(big % BigInt(totalTickets));

  // Weighted pick
  let cursor = 0;
  for (const e of cleaned) {
    cursor += e.tickets;
    if (pick < cursor) return { winnerUserId: e.userId, totalTickets };
  }

  // Should never happen, but keep safe fallback
  return { winnerUserId: cleaned[cleaned.length - 1].userId, totalTickets };
}
