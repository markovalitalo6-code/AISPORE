import { Router, type Request, type Response } from "express";
import { runDrawEngine } from "../core/rewardEngine";
import { eventsStore } from "../core/eventsStore";

export const engineRouter = Router();

function getAdminKey(): string {
  return String(process.env.ADMIN_KEY ?? "").trim();
}

function requireAdmin(req: Request, res: Response): boolean {
  const required = getAdminKey();
  if (!required) return res.status(500).json({ error: "ADMIN_KEY not configured" }), false;
  const got = String(req.header("x-admin-key") ?? "").trim();
  if (got !== required) return res.status(401).json({ error: "Unauthorized" }), false;
  return true;
}

// LOCKED v1 defaults (can be moved to decisions later)
const TIERS = [3000, 5000, 8000, 12000, 20000, 40000];
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes rolling

function currentTier(mc: number): number | null {
  let t: number | null = null;
  for (const x of TIERS) if (mc >= x) t = x;
  return t;
}

function lastDrawTsForWeek(week: string): number {
  const draws = eventsStore.tail("draw", 5000) as any[];
  const inWeek = draws.filter((d) => d.week === week);
  if (!inWeek.length) return 0;
  return Math.max(...inWeek.map((d) => Number(d.createdAt ?? 0)));
}

function alreadyDrawnForTier(week: string, tier: number): any | null {
  const draws = eventsStore.tail("draw", 5000) as any[];

  // if we have a tagOnly marker for this tier, resolve it back to the original draw
  const tag = draws.find((d) => d.week === week && Number(d.mcTier ?? 0) === tier && d.tagOnly === true && d.refDrawId);
  if (tag?.refDrawId) {
    const orig = draws.find((d) => d.id === tag.refDrawId && d.tagOnly !== true) ?? null;
    return orig ?? tag;
  }

  // fallback: direct draw event carries mcTier
  return draws.find((d) => d.week === week && Number(d.mcTier ?? 0) === tier && d.tagOnly !== true) ?? null;
}

/**
 * POST /engine/run (ADMIN)
 * body: { week, seed, mc? }
 */
engineRouter.post("/engine/run", (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;

  const week = String(req.body?.week ?? "").trim();
  const seed = String(req.body?.seed ?? "").trim();
  const mc = Number(req.body?.mc ?? 0);

  const result = runDrawEngine({ week, seed, mc });
  return res.json(result);
});

/**
 * POST /engine/hybrid-check (ADMIN)
 * body: { week, seed, mc, force?: boolean }
 *
 * Trigger rules:
 * - determine currentTier(mc). If null -> no trigger.
 * - tier-idempotency: if (week+tier) already has draw, do not trigger (return reused info).
 * - cooldown: if last draw in week < COOLDOWN_MS ago, do not trigger (unless force).
 * - when triggered: run draw engine with seed that includes tier marker (to keep reproducibility)
 */
engineRouter.post("/engine/hybrid-check", (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;

  const week = String(req.body?.week ?? "").trim();
  const seed = String(req.body?.seed ?? "").trim();
  const mc = Number(req.body?.mc ?? 0);
  const force = Boolean(req.body?.force ?? false);

  if (!week) return res.status(400).json({ error: "Missing week" });
  if (!seed) return res.status(400).json({ error: "Missing seed" });
  if (!Number.isFinite(mc) || mc < 0) return res.status(400).json({ error: "Invalid mc" });

  const tier = currentTier(mc);
  if (!tier) {
    return res.json({ ok: true, triggered: false, reason: "below-min-tier" });
  }

  const existingTierDraw = alreadyDrawnForTier(week, tier);
  if (existingTierDraw) {
    return res.json({
      ok: true,
      triggered: false,
      reason: "tier-idempotent",
      result: { reused: true, drawEvent: existingTierDraw },
    });
  }

  const lastTs = lastDrawTsForWeek(week);
  const now = Date.now();
  if (!force && lastTs && now - lastTs < COOLDOWN_MS) {
    return res.json({
      ok: true,
      triggered: false,
      reason: "cooldown",
      cooldownMs: COOLDOWN_MS,
      nextAllowedAt: lastTs + COOLDOWN_MS,
    });
  }

  const seeded = `${seed}::TIER_${tier}`;
  const result: any = runDrawEngine({ week, seed: seeded, mc });

  // If result includes drawEvent, tag it with mcTier (append-only: emit an extra draw-tag event? simplest: append a tiny draw event tag)
  // Because events are append-only and runDrawEngine already wrote drawEvent, we also append a small draw "tag" as a payout-status style record:
  if (result?.drawEvent?.id) {
    eventsStore.append("draw", {
      refDrawId: result.drawEvent.id,
      week,
      seed: seeded,
      mc,
      mcTier: tier,
      tagOnly: true,
      ts: Date.now(),
    });
    // also mirror tier on returned object
    result.drawEvent.mcTier = tier;
  }

  return res.json({
    ok: true,
    triggered: true,
    reason: force ? "force" : "tier-or-interval",
    tier,
    result,
  });
});
