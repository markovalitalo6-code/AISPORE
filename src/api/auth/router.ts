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
  return res.json({ userId: user.id });
});

/**
 * POST /auth/wallet/challenge
 * body: { userId: string, walletPublicKey: string }
 * returns: { nonce, message, expiresAt }
 */
authRouter.post("/wallet/challenge", (req: Request, res: Response) => {
  try {
    const userId = String(req.body?.userId ?? "").trim();
    const walletPublicKey = String(req.body?.walletPublicKey ?? "").trim();
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!walletPublicKey) return res.status(400).json({ error: "Missing walletPublicKey" });

    const c = store.createWalletChallenge(userId, walletPublicKey);
    return res.json({ nonce: c.nonce, message: c.message, expiresAt: c.expiresAt });
  } catch (e: any) {
    return res.status(400).json({ error: String(e?.message ?? e) });
  }
});

/**
 * POST /auth/wallet/link
 * body: { userId: string, walletPublicKey: string, nonce: string, signature: string }
 * returns: { ok: true, user, link }
 */
authRouter.post("/wallet/link", (req: Request, res: Response) => {
  try {
    const userId = String(req.body?.userId ?? "").trim();
    const walletPublicKey = String(req.body?.walletPublicKey ?? "").trim();
    const nonce = String(req.body?.nonce ?? "").trim();
    const signature = String(req.body?.signature ?? "").trim();

    const out = store.linkWalletFromChallenge({ userId, walletPublicKey, nonce, signature });
    return res.json({ ok: true, user: out.user, link: out.link });
  } catch (e: any) {
    return res.status(400).json({ error: String(e?.message ?? e) });
  }
});

/**
 * GET /auth/wallet/by-user/:userId
 * PUBLIC readback for Web proof.
 */
authRouter.get("/wallet/by-user/:userId", (req: Request, res: Response) => {
  const userId = String(req.params.userId ?? "").trim();
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  const link = store.getWalletLinkByUser(userId);
  if (!link) return res.status(404).json({ error: "Not found" });
  return res.json(link);
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
