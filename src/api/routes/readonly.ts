import { Router, type Request, type Response } from "express";
import { calcTickets } from "../ticket-calculator/calcTickets";
import { runWeeklyRaffle } from "../raffle/weeklyRaffle";

export const readonlyRouter = Router();
readonlyRouter.get("/whoami", (_req: Request, res: Response) => {
  return res.json({ service: "AISPORE_API", router: "readonly", ts: Date.now() });
});

/**
 * GET /health
 */
readonlyRouter.get("/health", (_req: Request, res: Response) => {
  return res.json({ ok: true });
});

/**
 * POST /calc/tickets
 * body: {
 *   userAvgTokens7d: number,
 *   games7d: number,
 *   activeRefs: number,
 *   tierMinTokens: number,
 *   baseTickets: number,
 *   bronzeMinTokens: number
 * }
 * returns: TicketCalcOutput
 */
readonlyRouter.post("/calc/tickets", (req: Request, res: Response) => {
  const out = calcTickets({
    userAvgTokens7d: Number(req.body?.userAvgTokens7d ?? 0),
    games7d: Number(req.body?.games7d ?? 0),
    activeRefs: Number(req.body?.activeRefs ?? 0),
    tierMinTokens: Number(req.body?.tierMinTokens ?? 1),
    baseTickets: Number(req.body?.baseTickets ?? 0),
    bronzeMinTokens: Number(req.body?.bronzeMinTokens ?? 0),
  });
  return res.json(out);
});

/**
 * POST /raffle/run
 * body: { seed: string, entries: Array<{ userId: string, tickets: number }> }
 * returns: { winnerUserId: string | null, totalTickets: number }
 */
readonlyRouter.post("/raffle/run", (req: Request, res: Response) => {
  const seed = String(req.body?.seed ?? "").trim();
  const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];

  if (!seed) return res.status(400).json({ error: "Missing seed" });

  const result = runWeeklyRaffle(entries, seed);
  return res.json(result);
});
