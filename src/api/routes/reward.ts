import { Router, type Request, type Response } from "express";
import { store } from "../core/store";
import crypto from "crypto";

export const rewardRouter = Router();

function getAdminKey(): string {
  return String(process.env.ADMIN_KEY ?? "").trim();
}

function requireAdmin(req: Request, res: Response): boolean {
  const required = getAdminKey();
  // if no ADMIN_KEY configured, do NOT allow writes by accident
  if (!required) {
    return res.status(500).json({ error: "ADMIN_KEY not configured" }), false;
    }
  const got = String(req.header("x-admin-key") ?? "").trim();
  if (got !== required) {
    return res.status(401).json({ error: "Unauthorized" }), false;
  }
  return true;
}

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * POST /reward/lock (ADMIN)
 * body: { week, seed, entries, winnerUserId, totalTickets }
 * returns: locked record (idempotent per week)
 */
rewardRouter.post("/reward/lock", (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;

  const week = String(req.body?.week ?? "").trim();
  const seed = String(req.body?.seed ?? "").trim();
  const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
  const winnerUserId = String(req.body?.winnerUserId ?? "").trim();
  const totalTickets = Number(req.body?.totalTickets ?? 0);

  if (!week) return res.status(400).json({ error: "Missing week" });
  if (!seed) return res.status(400).json({ error: "Missing seed" });
  if (!winnerUserId) return res.status(400).json({ error: "Missing winnerUserId" });
  if (!Number.isFinite(totalTickets) || totalTickets < 0) {
    return res.status(400).json({ error: "Invalid totalTickets" });
  }

  // idempotent per week
  const existing = store.rewardGetByWeek(week);
  if (existing) return res.json(existing);

  const entriesHash = sha256Hex(JSON.stringify(entries));

  const record = store.rewardInsert({
    week,
    seed,
    entriesHash,
    winnerUserId,
    totalTickets,
    rewardType: "CHEST_WIN",
    rewardTier: "BRONZE",
    locked: true,
  });

  return res.json(record);
});

/**
 * GET /reward/:id (PUBLIC)
 */
rewardRouter.get("/reward/:id", (req: Request, res: Response) => {
  const id = String(req.params.id ?? "").trim();
  const record = store.rewardGetById(id);
  if (!record) return res.status(404).json({ error: "Not found" });
  return res.json(record);
});

/**
 * GET /reward/by-week/:week (PUBLIC)
 */
rewardRouter.get("/reward/by-week/:week", (req: Request, res: Response) => {
  const week = String(req.params.week ?? "").trim();
  const record = store.rewardGetByWeek(week);
  if (!record) return res.status(404).json({ error: "Not found" });
  return res.json(record);
});

