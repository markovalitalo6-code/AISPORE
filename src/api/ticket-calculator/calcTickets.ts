/**
 * Ticket calculation (LOCKED from llmao/build/specs/C_v1_fixed.md)
 * Deterministic, no side effects.
 */

export type Tier = "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";

export interface TicketCalcInput {
  userAvgTokens7d: number; // H
  games7d: number;         // 0..7 (days played)
  activeRefs: number;      // 0..5 (cap)
  tierMinTokens: number;   // M (min tokens of the user's tier)
  baseTickets: number;     // per tier: 10/25/45/70
  bronzeMinTokens: number; // eligibility floor
}

export interface TicketCalcOutput {
  eligible: boolean;
  tickets: number; // 0..300
  breakdown: {
    holdWeight: number;
    activityWeight: number;
    refWeight: number;
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function calcTickets(input: TicketCalcInput): TicketCalcOutput {
  const H = Math.max(0, input.userAvgTokens7d);
  const M = Math.max(1, input.tierMinTokens);

  const eligible = H >= Math.max(0, input.bronzeMinTokens);
  if (!eligible) {
    return {
      eligible: false,
      tickets: 0,
      breakdown: { holdWeight: 0, activityWeight: 0, refWeight: 0 },
    };
  }

  // 1) hold_weight = 1 + ln(1 + H/M), cap 2.5
  const holdWeightRaw = 1 + Math.log(1 + H / M);
  const holdWeight = clamp(holdWeightRaw, 0, 2.5);

  // 2) activity_weight based on games7d (days played 0..7)
  const g = clamp(Math.floor(input.games7d), 0, 7);
  const activityWeight = g <= 2 ? 1.0 : g <= 4 ? 1.1 : 1.3;

  // 3) ref_weight = 1.0 + 0.03*active_refs, cap active_refs<=5
  const refs = clamp(Math.floor(input.activeRefs), 0, 5);
  const refWeight = 1.0 + 0.03 * refs;

  // 4) base tickets (already passed in)
  const base = Math.max(0, input.baseTickets);

  // 5) final tickets, cap 300
  const raw = base * holdWeight * activityWeight * refWeight;
  const tickets = clamp(Math.floor(raw), 0, 300);

  return {
    eligible: true,
    tickets,
    breakdown: { holdWeight, activityWeight, refWeight },
  };
}

