import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'aispore_v1.sqlite');
const db = new Database(dbPath);
console.log('[rewards-db] using', dbPath);
// Pragmas for reliability/perf
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    userId INTEGER PRIMARY KEY,
    walletAddress TEXT,
    tier TEXT DEFAULT 'none',
    tokensHeld REAL DEFAULT 0,
    daysHeld INTEGER DEFAULT 0,
    lastPlayedAt TEXT,
    playHistory TEXT DEFAULT '[]',
    ticketsWeek INTEGER DEFAULT 0,
    ticketsTotal INTEGER DEFAULT 0,
    referrerId INTEGER,
    walletAgeDays INTEGER DEFAULT 0,
    txCount INTEGER DEFAULT 0,
    isBurned INTEGER DEFAULT 0,
    totalPlays INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS draws (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weekNumber INTEGER NOT NULL,
    winners TEXT NOT NULL, -- JSON array of userIds
    totalCandidates INTEGER NOT NULL,
    winnerCount INTEGER NOT NULL,
    timestamp TEXT NOT NULL
  );
`);

export default db;
