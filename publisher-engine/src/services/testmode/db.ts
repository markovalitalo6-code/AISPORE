
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.REWARDS_DB_PATH
  ? String(process.env.REWARDS_DB_PATH)
  : path.join(process.cwd(), "aispore_v1.sqlite");

export const db = new Database(DB_PATH);

export function ensureSchema() {
  db.exec(`
    PRAGMA journal_mode=WAL;

    CREATE TABLE IF NOT EXISTS tm_users (
      tg_id TEXT PRIMARY KEY,
      username TEXT,
      first_seen INTEGER NOT NULL,
      last_seen INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tm_tickets (
      tg_id TEXT PRIMARY KEY,
      score INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tm_mc_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tm_chest_events (
      event_id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      mc INTEGER NOT NULL,
      seed TEXT NOT NULL,
      snapshot_count INTEGER NOT NULL,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS tm_chest_winners (
      event_id INTEGER NOT NULL,
      tg_id TEXT NOT NULL,
      username TEXT,
      prize TEXT NOT NULL,
      weight REAL NOT NULL,
      score INTEGER NOT NULL,
      PRIMARY KEY (event_id, tg_id),
      FOREIGN KEY (event_id) REFERENCES tm_chest_events(event_id)
    );

    CREATE TABLE IF NOT EXISTS tm_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      action TEXT NOT NULL,
      data TEXT
    );
  `);
}
