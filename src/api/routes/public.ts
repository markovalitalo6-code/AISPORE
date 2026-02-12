import { Router, type Request, type Response } from "express";
import { eventsStore } from "../core/eventsStore";

export const publicRouter = Router();

/**
 * GET /public/feed?week=YYYY-W##
 * Public read-only "dashboard feed" for the web UI.
 */
publicRouter.get("/public/feed", (req: Request, res: Response) => {
  const week = String(req.query.week ?? "").trim();

  const draws = eventsStore.tail("draw", 5000) as any[];
  const payouts = eventsStore.tail("payout", 5000) as any[];
  const treasury = eventsStore.tail("treasury", 5000) as any[];

  // last treasury snapshot
  const latestTreasury = treasury.sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0))[0] ?? null;

  // filter real draws (exclude tagOnly) + optional week filter
  const realDraws = draws.filter((d) => d.tagOnly !== true);
  const drawByWeek = week ? realDraws.filter((d) => d.week === week) : realDraws;

  const latestDraw = drawByWeek.sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0))[0] ?? null;
  const last10Draws = drawByWeek.sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0)).slice(0, 10);

  // pending payouts (original payouts only; status pending)
  const pending = payouts
    .filter((p) => p.status === "pending" && !p.refPayoutId)
    .sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0))
    .slice(0, 20);

  return res.json({
    ok: true,
    week: week || null,
    latestTreasury,
    latestDraw,
    draws: last10Draws,
    pendingPayouts: pending,
  });
});
