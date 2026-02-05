import { Router, type Request, type Response } from "express";
import { store } from "../core/store";

export const authRouter = Router();

/**
 * POST /auth/identify
 * body: { walletPublicKey: string }
 * returns: { userId: string }
 *
 * Idempotent: same wallet => same userId, no "already exists" error.
 */
authRouter.post("/identify", (req: Request, res: Response) => {
  const walletPublicKey = String(req.body?.walletPublicKey ?? "").trim();
  if (!walletPublicKey) {
    return res.status(400).json({ error: "Missing walletPublicKey" });
  }

  const user = store.identify(walletPublicKey);
  return res.json({ userId: user.userId });
});

/**
 * GET /auth/me
 * Skeleton: provide userId via:
 * - header: x-user-id
 * - query:  ?userId=...
 */
authRouter.get("/me", (req: Request, res: Response) => {
  const userId =
    String(req.header("x-user-id") ?? "").trim() ||
    String(req.query.userId ?? "").trim();

  if (!userId) {
    return res.status(400).json({
      error: "Missing userId (x-user-id header or ?userId=)",
    });
  }

  const user = store.getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json(user);
});
