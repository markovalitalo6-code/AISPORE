/**
 * Treasury cap policy stub (FAASI 1.3)
 *
 * Rules:
 * - Deterministic
 * - No side effects
 * - Treasury is GLOBAL state (not per-user)
 */

export interface TreasuryState {
  balance: number; // current treasury balance (units decided later)
}

export interface TreasuryCaps {
  minBalance: number; // floor: below this, payouts blocked
  maxBalance: number; // ceiling: used later; for now validation only
}

export interface TreasuryDecision {
  allowPayout: boolean;
  reason: "OK" | "BELOW_MIN" | "INVALID_CAPS" | "NEGATIVE_BALANCE";
}

export function decidePayout(treasury: TreasuryState, caps: TreasuryCaps): TreasuryDecision {
  if (treasury.balance < 0) return { allowPayout: false, reason: "NEGATIVE_BALANCE" };
  if (caps.minBalance < 0 || caps.maxBalance < 0 || caps.maxBalance < caps.minBalance) {
    return { allowPayout: false, reason: "INVALID_CAPS" };
  }
  if (treasury.balance < caps.minBalance) return { allowPayout: false, reason: "BELOW_MIN" };
  return { allowPayout: true, reason: "OK" };
}
