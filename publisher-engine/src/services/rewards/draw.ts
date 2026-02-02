import db from './db';
type DrawResult = {
  winners: number[];
  totalCandidates: number;
  winnerCount: number;
};

function getISOWeekNumberUTC(d: Date): number {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

function ensureDrawsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS draws (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weekNumber INTEGER NOT NULL,
      winners TEXT NOT NULL,
      totalCandidates INTEGER NOT NULL,
      winnerCount INTEGER NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
}

function weightFromTickets(ticketsWeek: number): number {
  // 1 entry per 10 tickets, min 1 if user has any tickets
  if (ticketsWeek <= 0) return 0;
  return Math.max(1, Math.floor(ticketsWeek / 10));
}

function pickOneWeighted(items: Array<{ id: number; w: number }>, totalW: number): number | null {
  if (totalW <= 0) return null;
  let r = Math.random() * totalW;
  for (const it of items) {
    if (it.w <= 0) continue;
    r -= it.w;
    if (r <= 0) return it.id;
  }
  return null;
}

export function runWeeklyDraw(): DrawResult {
  ensureDrawsTable();

  // Gate: ticketsWeek > 0 AND plays>=10 AND (walletAge/tx ok OR burned)
  const candidates = db.prepare(`
    SELECT * FROM users
    WHERE ticketsWeek > 0
      AND totalPlays >= 10
      AND ((walletAgeDays >= 30 AND txCount >= 10) OR isBurned = 1)
  `).all() as any[];

  const totalCandidates = candidates.length;
  if (totalCandidates === 0) return { winners: [], totalCandidates: 0, winnerCount: 0 };

  // winnerCount: min 1, max 500
  const winnerCount = Math.min(500, Math.max(1, Math.floor(totalCandidates * 0.12)));

  // Build weighted list
  const weighted = candidates
    .map(u => ({ id: u.userId, w: weightFromTickets(u.ticketsWeek) }))
    .filter(x => x.w > 0);

  let totalW = weighted.reduce((a, b) => a + b.w, 0);
  if (totalW <= 0) return { winners: [], totalCandidates, winnerCount: 0 };

  const winners: number[] = [];

  // Weighted without replacement: after a winner is picked, set its weight to 0
  const maxPicks = Math.min(winnerCount, weighted.length);
  for (let i = 0; i < maxPicks; i++) {
    const picked = pickOneWeighted(weighted, totalW);
    if (picked == null) break;
    winners.push(picked);

    const idx = weighted.findIndex(x => x.id === picked);
    if (idx >= 0) {
      totalW -= weighted[idx].w;
      weighted[idx].w = 0;
    }
    if (totalW <= 0) break;
  }

  const weekNumber = getISOWeekNumberUTC(new Date());

  db.prepare(
    'INSERT INTO draws (weekNumber, winners, totalCandidates, winnerCount, createdAt) VALUES (?, ?, ?, ?, ?)'
  ).run(
    weekNumber,
    JSON.stringify(winners),
    totalCandidates,
    winnerCount,
    new Date().toISOString()
  );

  // Reset weekly tickets
  db.prepare('UPDATE users SET ticketsWeek = 0').run();

  return { winners, totalCandidates, winnerCount };
}
