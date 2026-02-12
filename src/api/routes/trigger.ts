import { Router } from "express";
import { shouldTriggerDraw } from "../core/hybridTrigger";
import { runDrawEngine } from "../core/rewardEngine";

export const triggerRouter = Router();

function getAdminKey(): string {
  return String(process.env.ADMIN_KEY ?? "").trim();
}

triggerRouter.post("/engine/hybrid-check", (req, res) => {
  const required = getAdminKey();
  const got = String(req.header("x-admin-key") ?? "").trim();

  if (!required || got !== required) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const mc = Number(req.body?.mc ?? 0);
  const week = String(req.body?.week ?? "").trim();
  const seed = String(req.body?.seed ?? "").trim();

  if (!mc || !week || !seed) {
    return res.status(400).json({ error: "Missing mc, week or seed" });
  }

  const decision = shouldTriggerDraw(mc);

  if (!decision.trigger) {
    return res.json({ ok: true, triggered: false });
  }

  const result = runDrawEngine({ week, seed, mc });

  return res.json({
    ok: true,
    triggered: true,
    reason: decision.reason,
    result,
  });
});
