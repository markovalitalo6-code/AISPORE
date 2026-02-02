import db from './db';
import { CONFIG, Tier, UserRow } from './types';
import { differenceInDays } from 'date-fns';

function nowIso() { return new Date().toISOString(); }
function todayKey(iso: string) { return iso.split('T')[0]; }

export function ensureUser(userId: number): UserRow {
  const row = db.prepare('SELECT * FROM users WHERE userId = ?').get(userId) as UserRow | undefined;
  if (row) return row;

  const ts = nowIso();
  const fresh: UserRow = {
    userId,
    walletAddress: null,
    tier: 'none',
    tokensHeld: 0,
    daysHeld: 0,
    lastPlayedAt: null,
    playHistory: '[]',
    ticketsWeek: 0,
    ticketsTotal: 0,
    referrerId: null,
    walletAgeDays: 0,
    txCount: 0,
    isBurned: 0,
    totalPlays: 0,
    createdAt: ts,
    updatedAt: ts,
  };

  db.prepare(`
    INSERT INTO users (
      userId, walletAddress, tier, tokensHeld, daysHeld, lastPlayedAt, playHistory,
      ticketsWeek, ticketsTotal, referrerId, walletAgeDays, txCount, isBurned, totalPlays,
      createdAt, updatedAt
    ) VALUES (
      @userId, @walletAddress, @tier, @tokensHeld, @daysHeld, @lastPlayedAt, @playHistory,
      @ticketsWeek, @ticketsTotal, @referrerId, @walletAgeDays, @txCount, @isBurned, @totalPlays,
      @createdAt, @updatedAt
    )
  `).run(fresh);

  return fresh;
}

export function getUser(userId: number): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE userId = ?').get(userId) as UserRow | undefined;
}

export function saveUser(u: UserRow) {
  u.updatedAt = nowIso();
  db.prepare(`
    UPDATE users SET
      walletAddress=@walletAddress,
      tier=@tier,
      tokensHeld=@tokensHeld,
      daysHeld=@daysHeld,
      lastPlayedAt=@lastPlayedAt,
      playHistory=@playHistory,
      ticketsWeek=@ticketsWeek,
      ticketsTotal=@ticketsTotal,
      referrerId=@referrerId,
      walletAgeDays=@walletAgeDays,
      txCount=@txCount,
      isBurned=@isBurned,
      totalPlays=@totalPlays,
      updatedAt=@updatedAt
    WHERE userId=@userId
  `).run(u);
}

export function determineTier(tokensHeld: number): Tier {
  if (tokensHeld >= CONFIG.TIER_MIN.whale) return 'whale';
  if (tokensHeld >= CONFIG.TIER_MIN.core) return 'core';
  if (tokensHeld >= CONFIG.TIER_MIN.plankton) return 'plankton';
  return 'none';
}

export function calcTimeMultiplier(daysHeld: number): number {
  // 1 + 0.5*ln(days+1)
  return 1 + CONFIG.TIME_MULT.k * Math.log(daysHeld + 1);
}

export function calcConsistencyMultiplier(playHistoryJson: string): number {
  const history: string[] = safeParseJson(playHistoryJson, []);
  const now = new Date();
  const playedLast7 = history.filter(d => {
    const dt = new Date(d);
    return !Number.isNaN(dt.getTime()) && differenceInDays(now, dt) <= 7;
  }).length;

  if (playedLast7 >= CONFIG.CONSISTENCY.hiDays) return CONFIG.CONSISTENCY.hiMult;
  if (playedLast7 >= CONFIG.CONSISTENCY.midDays) return CONFIG.CONSISTENCY.midMult;
  return CONFIG.CONSISTENCY.lowMult;
}

export function calcHoldingMultiplier(tier: Tier, tokensHeld: number): number {
  if (tier === 'none') return 1.0;
  const minTokens =
    tier === 'plankton' ? CONFIG.TIER_MIN.plankton :
    tier === 'core' ? CONFIG.TIER_MIN.core :
    CONFIG.TIER_MIN.whale;

  // holding_multiplier = min(cap, log10(min + held) / log10(min))
  const denom = Math.log10(minTokens);
  const numer = Math.log10(minTokens + Math.max(0, tokensHeld));
  const raw = denom > 0 ? (numer / denom) : 1.0;
  return Math.min(CONFIG.HOLDING_MULT.cap, Math.max(1.0, raw));
}

export function calcDailyTickets(u: UserRow): { tickets: number, t: number, c: number, h: number, base: number } {
  const base = CONFIG.BASE_RATE[u.tier] ?? 0;
  const t = calcTimeMultiplier(u.daysHeld);
  const c = calcConsistencyMultiplier(u.playHistory);
  const h = calcHoldingMultiplier(u.tier, u.tokensHeld);

  const tickets = Math.max(0, Math.floor(base * t * c * h));
  return { tickets, t, c, h, base };
}

export function linkWallet(userId: number, address: string, tokensHeld: number, walletAgeDays: number, txCount: number, isBurned = 0) {
  const u = ensureUser(userId);
  u.walletAddress = address;
  u.tokensHeld = tokensHeld;
  u.walletAgeDays = walletAgeDays;
  u.txCount = txCount;
  u.isBurned = isBurned ? 1 : 0;

  // update tier
  u.tier = determineTier(tokensHeld);

  // if first time linking and user has holding, start daysHeld at 1
  if (u.daysHeld <= 0 && tokensHeld > 0) u.daysHeld = 1;

  saveUser(u);
  return { tier: u.tier, tokens: u.tokensHeld };
}

export function playSnakeCheckIn(userId: number) {
  const u = ensureUser(userId);
  if (!u.walletAddress) {
    return { ok: false, message: 'Link wallet first: /link <address>' };
  }

  const iso = nowIso();
  const history: string[] = safeParseJson(u.playHistory, []);

  const playedToday = history.some(d => todayKey(d) === todayKey(iso));
  if (playedToday) {
    return { ok: true, earned: 0, message: 'Already checked-in today. Come back tomorrow.' };
  }

  history.push(iso);
  const cleaned = history.filter(d => {
    const dt = new Date(d);
    return !Number.isNaN(dt.getTime()) && differenceInDays(new Date(), dt) <= 14;
  });

  u.playHistory = JSON.stringify(cleaned);
  u.lastPlayedAt = iso;
  u.totalPlays += 1;

  // Tickets for today
  const { tickets, t, c, h, base } = calcDailyTickets(u);
  u.ticketsWeek += tickets;
  u.ticketsTotal += tickets;

  saveUser(u);
  return { ok: true, earned: tickets, stats: { base, timeMult: t, consistencyMult: c, holdingMult: h } };
}

export function dailyAccrualTick() {
  // increment daysHeld only for users who have non-zero holding
  db.prepare(`UPDATE users SET daysHeld = daysHeld + 1 WHERE tokensHeld > 0`).run();
}

export function applySellPenalty(userId: number) {
  const u = getUser(userId);
  if (!u) return { ok: false, message: 'no user' };

  // rollback by halving daysHeld (equivalent to halving time multiplier)
  u.daysHeld = Math.max(1, Math.floor(u.daysHeld * CONFIG.SELL_PENALTY.rollbackFactor));
  saveUser(u);
  return { ok: true, daysHeld: u.daysHeld };
}

export function checkSellPenalty(userId: number, currentHoldingTokens: number) {
  const u = getUser(userId);
  if (!u) return { status: 'NO_USER' as const };

  const avg7 = Math.max(1, u.tokensHeld); // v1 simplification: last known tokens as proxy
  const sold = Math.max(0, avg7 - currentHoldingTokens);
  const pct = sold / avg7;

  if (pct > CONFIG.SELL_PENALTY.triggerPct) {
    const res = applySellPenalty(userId);
    // update tokensHeld and tier to current holding
    u.tokensHeld = currentHoldingTokens;
    u.tier = determineTier(currentHoldingTokens);
    saveUser(u);
    return { status: 'PENALTY_APPLIED' as const, pct, ...res };
  }

  // still update tokensHeld+tier
  u.tokensHeld = currentHoldingTokens;
  u.tier = determineTier(currentHoldingTokens);
  saveUser(u);
  return { status: 'OK' as const, pct };
}

export function topLeaderboard(limit = 10) {
  return db.prepare(`
    SELECT userId, tier, ticketsTotal, ticketsWeek, daysHeld
    FROM users
    ORDER BY ticketsTotal DESC
    LIMIT ?
  `).all(limit);
}

function safeParseJson<T>(s: string | null | undefined, fallback: T): T {
  try {
    if (!s) return fallback;
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
