import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { runWeeklyRaffle } from "../raffle/weeklyRaffle";

export const rewardRouter = Router();

// ===== Types =====
type Entry = { userId: string; tickets: number };

type RewardLockedPayload = {
  id: string;
  week: string;
  seed: string;
  winnerUserId: string | null;
  totalTickets: number;
  rewardType: "CHEST_WIN" | "NO_WINNER";
  rewardTier: "BRONZE";
  createdAt: number;
  locked: true;
};

// ===== File-backed store (JSONL) =====
const DATA_DIR = path.resolve(process.cwd(), "data");
const LOCKS_PATH = path.join(DATA_DIR, "reward_locks.jsonl");

const lockedByWeek = new Map<string, RewardLockedPayload>();
const lockedById = new Map<string, RewardLockedPayload>();

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(LOCKS_PATH)) fs.writeFileSync(LOCKS_PATH, "", "utf8");
}

function appendLock(lock: RewardLockedPayload) {
  // append 1 json per line
  fs.appendFileSync(LOCKS_PATH, JSON.stringify(lock) + "\n", "utf8");
}

function loadLocksFromDisk() {
  ensureDataFiles();
  const raw = fs.readFileSync(LOCKS_PATH, "utf8");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);

  for (const line of lines) {
    try {
      const lock = JSON.parse(line) as RewardLockedPayload;
      if (!lock?.id || !lock?.week) continue;

      lockedByWeek.set(lock.week, lock);
      lockedById.set(lock.id, lock);
    } catch {
      // ignore bad line (keep MVP resilient)
    }
  }
}

function stableId(input: Omit<RewardLockedPayload, "id">) {
  const raw = JSON.stringify(input);
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 24);
}

// Load persisted locks at module init
loadLocksFromDisk();

// ===== Routes =====

/**
 * GET /reward/:id
 */
rewardRouter.get("/:id", (req: Request, res: Response) => {
  const id = String(req.params.id ?? "").trim();
  if (!id) return res.status(400).json({ error: "Missing id" });

  const hit = lockedById.get(id);
  if (!hit) return res.status(404).json({ error: "Not found" });

  return res.json(hit);
});

/**
 * POST /reward/lock
 * body: {
 *   week: string,
 *   seed: string,
 *   entries: Array<{ userId: string, tickets: number }>,
 *   winnerUserId: string | null,
 *   totalTickets: number
 * }
 */
rewardRouter.post("/lock", (req: Request, res: Response) => {
  const week = String(req.body?.week ?? "").trim();
  const seed = String(req.body?.seed ?? "").trim();
  const entries: Entry[] = Array.isArray(req.body?.entries) ? req.body.entries : [];
  const winnerUserId =
    req.body?.winnerUserId === null ? null : String(req.body?.winnerUserId ?? "").trim();
  const totalTickets = Number(req.body?.totalTickets ?? 0);

  if (!week) return res.status(400).json({ error: "Missing week" });
  if (!seed) return res.status(400).json({ error: "Missing seed" });
  if (!Array.isArray(entries)) return res.status(400).json({ error: "Invalid entries" });

  // If already locked → return same payload
  const already = lockedByWeek.get(week);
  if (already) return res.json(already);

  // Verify raffle result matches deterministically (guardrail)
  const computed = runWeeklyRaffle(entries, seed);

  if (computed.totalTickets !== totalTickets) {
    return res.status(400).json({
      error: "totalTickets mismatch",
      expected: computed.totalTickets,
      got: totalTickets,
    });
  }
  if ((computed.winnerUserId ?? null) !== (winnerUserId ?? null)) {
    return res.status(400).json({
      error: "winnerUserId mismatch",
      expected: computed.winnerUserId ?? null,
      got: winnerUserId ?? null,
    });
  }

  const base: Omit<RewardLockedPayload, "id"> = {
    week,
    seed,
    winnerUserId: computed.winnerUserId ?? null,
    totalTickets: computed.totalTickets,
    rewardType: computed.winnerUserId ? "CHEST_WIN" : "NO_WINNER",
    rewardTier: "BRONZE",
    createdAt: Date.now(),
    locked: true,
  };

  const payload: RewardLockedPayload = { id: stableId(base), ...base };

  // Persist first, then index
  ensureDataFiles();
  appendLock(payload);
  lockedByWeek.set(week, payload);
  lockedById.set(payload.id, payload);

  return res.json(payload);
});

