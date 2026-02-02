export type Tier = 'none' | 'plankton' | 'core' | 'whale';

export interface UserRow {
  userId: number;                 // Telegram user id
  walletAddress: string | null;
  tier: Tier;
  tokensHeld: number;             // latest observed holding (token units)
  daysHeld: number;               // loyalty counter (we adjust on penalty)
  lastPlayedAt: string | null;    // ISO timestamp
  playHistory: string;            // JSON array of ISO timestamps (for last 14d)
  ticketsWeek: number;
  ticketsTotal: number;
  referrerId: number | null;
  walletAgeDays: number;
  txCount: number;
  isBurned: number;               // 0/1 (burn-to-enter)
  totalPlays: number;
  createdAt: string;              // ISO
  updatedAt: string;              // ISO
}

export const CONFIG = {
  // Tier thresholds in TOKEN units (v1: fixed token amounts)
  TIER_MIN: {
    plankton: 1000,
    core: 10000,
    whale: 100000,
  } as const,

  // Base daily ticket rates by tier
  BASE_RATE: {
    none: 0,
    plankton: 10,
    core: 30,
    whale: 60,
  } as const,

  // Consistency multiplier based on plays in last 7 days
  CONSISTENCY: {
    hiDays: 5,
    midDays: 3,
    hiMult: 1.3,
    midMult: 1.1,
    lowMult: 1.0,
  } as const,

  // Time multiplier: 1 + 0.5 * ln(daysHeld + 1)
  TIME_MULT: {
    k: 0.5,
  } as const,

  // Holding multiplier: smooth diminishing returns, capped
  HOLDING_MULT: {
    cap: 3.0,
  } as const,

  // Sell penalty trigger: sell > 25% within 24h (we model with checkSellPenalty helper)
  SELL_PENALTY: {
    triggerPct: 0.25,
    rollbackFactor: 0.5,   // halve time multiplier by halving daysHeld
  } as const,

  // Sybil gates for weekly draw eligibility
  GATES: {
    minWalletAgeDays: 30,
    minTxCount: 10,
    minTotalPlays: 10,
  } as const,

  // Weekly draw params
  DRAW: {
    winRate: 0.12,
    maxWinners: 500,
    // Pool compression: 1 entry per N tickets to keep RAM lower
    entryPerTickets: 10,
  } as const,
};
