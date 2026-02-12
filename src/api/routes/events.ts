import { Router, type Request, type Response } from "express";
import { eventsStore, type EventType } from "../core/eventsStore";

export const eventsRouter = Router();

function getAdminKey(): string {
  return String(process.env.ADMIN_KEY ?? "").trim();
}

function requireAdmin(req: Request, res: Response): boolean {
  const required = getAdminKey();
  if (!required) {
    res.status(500).json({ error: "ADMIN_KEY not configured" });
    return false;
  }
  const got = String(req.header("x-admin-key") ?? "").trim();
  if (got !== required) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

function parseType(v: any): EventType | null {
  const t = String(v ?? "").trim();
  if (t === "tickets" || t === "draw" || t === "payout" || t === "treasury") return t;
  return null;
}

/**
 * POST /events/append (ADMIN)
 * body: { type: "tickets"|"draw"|"payout", payload: object }
 */
eventsRouter.post("/events/append", (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;

  const type = parseType(req.body?.type);
  const payload = req.body?.payload;

  if (!type) return res.status(400).json({ error: "Invalid type" });
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "Missing payload object" });
  }

  const ev = eventsStore.append(type, payload);
  return res.json({ ok: true, event: ev });
});

/**
 * GET /events/:type?limit=50 (PUBLIC)
 */

/**
 * POST /payout/mark-paid (ADMIN)
 * body: { payoutId: string, txid: string }
 * Appends a new payout event with status="paid" referencing the original payoutId.
 */
eventsRouter.post("/payout/mark-paid", (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;

  const payoutId = String(req.body?.payoutId ?? "").trim();
  const txid = String(req.body?.txid ?? "").trim();
  if (!payoutId) return res.status(400).json({ error: "Missing payoutId" });
  if (!txid) return res.status(400).json({ error: "Missing txid" });

  // find original payout for context (optional)
  const orig = eventsStore.tail("payout", 5000).find((p: any) => p.id === payoutId) ?? null;

  const ev = eventsStore.append("payout", {
    refPayoutId: payoutId,
    txid,
    status: "paid",
    week: orig?.week,
    userId: orig?.userId,
    asset: orig?.asset,
    amount: orig?.amount,
    treasuryBefore: orig?.treasuryBefore,
    treasuryAfter: orig?.treasuryAfter,
    payoutRequested: orig?.payoutRequested,
    caps: orig?.caps,
    drawId: orig?.drawId,
  });

  return res.json({ ok: true, event: ev });
});



/**
 * GET /payout/status/:payoutId (PUBLIC)
 * Returns resolved status for a payoutId:
 * - pending (no paid ref found)
 * - paid (latest paid ref found, includes txid)
 */
eventsRouter.get("/payout/status/:payoutId", (req: Request, res: Response) => {
  const payoutId = String(req.params.payoutId ?? "").trim();
  if (!payoutId) return res.status(400).json({ error: "Missing payoutId" });

  const payouts = eventsStore.tail("payout", 5000);

  const original = payouts.find((p: any) => p.id === payoutId) ?? null;
  const paid = payouts
    .filter((p: any) => p.refPayoutId === payoutId && p.status === "paid")
    .sort((a: any, b: any) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0))[0] ?? null;

  if (!original) return res.status(404).json({ error: "Not found" });

  if (paid) {
    return res.json({
      ok: true,
      payoutId,
      status: "paid",
      paidEventId: paid.id,
      txid: paid.txid,
      paidAt: paid.createdAt,
    });
  }

  return res.json({ ok: true, payoutId, status: "pending" });
});

eventsRouter.get("/events/:type", (req: Request, res: Response) => {
  const type = parseType(req.params.type);
  if (!type) return res.status(400).json({ error: "Invalid type" });

  const limit = Math.min(500, Math.max(1, Number(req.query.limit ?? 50)));
  const events = eventsStore.tail(type, limit);
  return res.json({ ok: true, type, count: events.length, events });
});
