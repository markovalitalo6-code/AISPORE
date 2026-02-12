import { eventsStore } from "./eventsStore";
import { runWeeklyRaffle } from "../raffle/weeklyRaffle";
import { getTreasuryBalanceSol, calcPayoutSol, enforceCaps } from "./treasuryGuard";

type EngineInput = {
  week: string;
  seed: string;
  mc?: number;
};

export function runDrawEngine(input: EngineInput) {
  const week = String(input.week ?? "").trim();
  const seed = String(input.seed ?? "").trim();
  const mc = Number(input.mc ?? 0);

  if (!week) return { ok: false, error: "Missing week" };
  if (!seed) return { ok: false, error: "Missing seed" };
  if (!Number.isFinite(mc) || mc < 0) return { ok: false, error: "Invalid mc" };

  // Idempotency: one draw per (week + seed)
  const existing = eventsStore
    .tail("draw", 5000)
    .find((d: any) => d.week === week && d.seed === seed);

  if (existing) {
    return { ok: true, reused: true, drawEvent: existing };
  }

  // 1) Collect ticket events (last N)
  const ticketEvents = eventsStore.tail("tickets", 5000);

  // Aggregate tickets per userId
  const byUser = new Map<string, number>();
  for (const e of ticketEvents as any[]) {
    const userId = String(e.userId ?? "").trim();
    const tickets = Number(e.tickets ?? 0);
    if (!userId) continue;
    if (!Number.isFinite(tickets) || tickets <= 0) continue;
    byUser.set(userId, (byUser.get(userId) ?? 0) + tickets);
  }

  const entries = Array.from(byUser.entries()).map(([userId, tickets]) => ({
    userId,
    tickets,
  }));

  // 2) Deterministic winner
  const raffle = runWeeklyRaffle(entries as any, seed);
  const winnerUserId = String((raffle as any).winnerUserId ?? "").trim();
  const totalTickets = Number((raffle as any).totalTickets ?? 0);

  if (!winnerUserId) {
    return { ok: true, winnerUserId: null, totalTickets, entriesCount: entries.length };
  }

  // 3) Treasury ledger + caps
  const treasuryBefore = getTreasuryBalanceSol();
  const payoutRequested = calcPayoutSol(treasuryBefore);
  const caps = enforceCaps(treasuryBefore, payoutRequested);

  if (caps.allowed <= 0) {
    return { ok: false, error: "Treasury cap reached", caps };
  }

  const payoutAmount = caps.allowed;
  const treasuryAfter = Math.max(0, treasuryBefore - payoutAmount);

  // 4) Write draw event (append-only)
  const drawEvent = eventsStore.append("draw", {
    week,
    seed,
    mc,
    totalTickets,
    winnerUserId,

    // ledger fields
    treasuryBefore,
    treasuryAfter,
    payoutAmount,
    payoutRequested,
    caps,
  });

  // 5) Write payout event (pending; execution later)
  const payoutEvent = eventsStore.append("payout", {
    week,
    userId: winnerUserId,
    asset: "SOL",
    amount: payoutAmount,
    status: "pending",

    // ledger fields
    treasuryBefore,
    treasuryAfter,
    payoutRequested,
    caps,
    drawId: (drawEvent as any).id,
  });

  return {
    ok: true,
    winnerUserId,
    totalTickets,
    drawEvent,
    payoutEvent,
  };
}
