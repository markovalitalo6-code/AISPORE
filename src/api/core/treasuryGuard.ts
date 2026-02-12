import { eventsStore } from "./eventsStore";

const PAYOUT_PERCENT = 0.002;      // 0.2% per draw
const DAILY_CAP_PERCENT = 0.02;    // 2% per 24h (safety)
const DRAW_CAP_PERCENT  = 0.002;   // 0.2% per draw (same as payout, but keep explicit)

export function getTreasuryBalanceSol(): number {
  const latest = eventsStore.tail("treasury" as any, 1)[0] ?? null;
  return latest ? Number(latest.balanceSol ?? 0) : 0;
}

export function getDistributedLast24hSol(): number {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const payouts = eventsStore.tail("payout", 5000);
  let sum = 0;
  for (const p of payouts) {
    if (Number(p.createdAt ?? 0) > dayAgo) sum += Number(p.amount ?? 0);
  }
  return sum;
}

export function calcPayoutSol(treasuryBalanceSol: number): number {
  return treasuryBalanceSol * PAYOUT_PERCENT;
}

export function enforceCaps(treasuryBalanceSol: number, payoutSol: number) {
  const dailyCap = treasuryBalanceSol * DAILY_CAP_PERCENT;
  const drawCap = treasuryBalanceSol * DRAW_CAP_PERCENT;
  const distributed24h = getDistributedLast24hSol();
  const remainingDaily = Math.max(0, dailyCap - distributed24h);

  const allowed = Math.min(payoutSol, drawCap, remainingDaily);

  return {
    allowed,
    treasuryBalanceSol,
    payoutRequested: payoutSol,
    distributed24h,
    dailyCap,
    drawCap,
    remainingDaily,
  };
}
