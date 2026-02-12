import crypto from "crypto";
import fs from "fs";
import path from "path";
import nacl from "tweetnacl";
import bs58 from "bs58";

/** -------- TYPES -------- */

export type UserRecord = {
  id: string;
  walletPublicKey: string;
  walletVerified?: boolean;
  walletVerifiedAt?: number;
  createdAt: number;
};

export type RewardRecord = {
  id: string;
  week: string;
  seed: string;
  entriesHash: string;
  winnerUserId: string;
  totalTickets: number;
  rewardType: "CHEST_WIN";
  rewardTier: "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";
  createdAt: number;
  locked: boolean;
};

export type WalletLinkRecord = {
  id: string;
  userId: string;
  walletPublicKey: string;
  message: string;
  signature: string; // base58 or base64 accepted; stored as received
  nonce: string;
  createdAt: number;
  verified: true;
};

type Challenge = {
  nonce: string;
  userId: string;
  walletPublicKey: string;
  message: string;
  createdAt: number;
  expiresAt: number;
};

function genIdHex(bytes = 12) {
  return crypto.randomBytes(bytes).toString("hex");
}

function dataPath(...parts: string[]) {
  return path.resolve(__dirname, "..", "data", ...parts);
}

function ensureFile(p: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  if (!fs.existsSync(p)) fs.writeFileSync(p, "", "utf8");
}

function readJsonl<T>(p: string): T[] {
  ensureFile(p);
  const raw = fs.readFileSync(p, "utf8");
  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
  const out: T[] = [];
  for (const line of lines) {
    try { out.push(JSON.parse(line)); } catch { /* ignore bad lines */ }
  }
  return out;
}

function appendJsonl(p: string, obj: unknown) {
  ensureFile(p);
  fs.appendFileSync(p, JSON.stringify(obj) + "\n", "utf8");
}

function toBytesMessage(message: string): Uint8Array {
  return new TextEncoder().encode(message);
}

function decodeSigFlexible(sig: string): Uint8Array {
  const s = String(sig || "").trim();
  if (!s) throw new Error("signature required");
  // try base58 first
  try { return bs58.decode(s); } catch {}
  // then base64
  try { return Uint8Array.from(Buffer.from(s, "base64")); } catch {}
  throw new Error("signature must be base58 or base64");
}

/** -------- STORE -------- */

class FileBackedStore {
  private usersById = new Map<string, UserRecord>();
  private usersByWallet = new Map<string, UserRecord>();

  private rewardsByWeek = new Map<string, RewardRecord>();
  private rewardsById = new Map<string, RewardRecord>();

  private walletLinksByUser = new Map<string, WalletLinkRecord>();

  private challengesByNonce = new Map<string, Challenge>();

  private USERS_FILE = dataPath("users.jsonl");
  private REWARDS_FILE = dataPath("reward_locks.jsonl");
  private WALLET_LINKS_FILE = dataPath("wallet_links.jsonl");

  constructor() {
    // Load users
    for (const u of readJsonl<UserRecord>(this.USERS_FILE)) {
      if (!u?.id || !u?.walletPublicKey) continue;
      this.usersById.set(u.id, u);
      this.usersByWallet.set(u.walletPublicKey, u);
    }

    // Load rewards
    for (const r of readJsonl<RewardRecord>(this.REWARDS_FILE)) {
      if (!r?.id || !r?.week) continue;
      this.rewardsByWeek.set(r.week, r);
      this.rewardsById.set(r.id, r);
    }

    // Load wallet links (latest per user wins)
    for (const w of readJsonl<WalletLinkRecord>(this.WALLET_LINKS_FILE)) {
      if (!w?.id || !w?.userId) continue;
      const prev = this.walletLinksByUser.get(w.userId);
      if (!prev || (w.createdAt ?? 0) > (prev.createdAt ?? 0)) {
        this.walletLinksByUser.set(w.userId, w);
      }
    }
  }

  /** AUTH: identify wallet -> returns existing or creates a new user */
  identify(walletPublicKey: string): UserRecord {
    const key = String(walletPublicKey || "").trim();
    if (!key) throw new Error("walletPublicKey required");

    const existing = this.usersByWallet.get(key);
    if (existing) return existing;

    const user: UserRecord = {
      id: genIdHex(12),
      walletPublicKey: key,
      walletVerified: false,
      createdAt: Date.now(),
    };

    this.usersById.set(user.id, user);
    this.usersByWallet.set(user.walletPublicKey, user);
    appendJsonl(this.USERS_FILE, user);
    return user;
  }

  getUserById(userId: string): UserRecord | null {
    return this.usersById.get(userId) ?? null;
  }

  /** REWARDS */
  rewardGetByWeek(week: string): RewardRecord | null {
    return this.rewardsByWeek.get(week) ?? null;
  }

  rewardGetById(id: string): RewardRecord | null {
    return this.rewardsById.get(id) ?? null;
  }

  rewardInsert(input: Omit<RewardRecord, "id" | "createdAt">): RewardRecord {
    const existing = this.rewardsByWeek.get(input.week);
    if (existing) return existing;

    const record: RewardRecord = {
      ...input,
      id: genIdHex(12),
      createdAt: Date.now(),
    };

    this.rewardsByWeek.set(record.week, record);
    this.rewardsById.set(record.id, record);
    appendJsonl(this.REWARDS_FILE, record);
    return record;
  }

  /** WALLET LINKING (challenge -> signature verify -> append-only proof) */
  createWalletChallenge(userId: string, walletPublicKey: string): Challenge {
    const uid = String(userId || "").trim();
    const w = String(walletPublicKey || "").trim();
    if (!uid) throw new Error("userId required");
    if (!w) throw new Error("walletPublicKey required");
    const user = this.getUserById(uid);
    if (!user) throw new Error("user not found");

    const nonce = genIdHex(12);
    const createdAt = Date.now();
    const expiresAt = createdAt + 10 * 60 * 1000; // 10 min

    // Message must be stable and explicit for web proof
    const message =
      `AISPORE WALLET LINK\n` +
      `userId: ${uid}\n` +
      `wallet: ${w}\n` +
      `nonce: ${nonce}\n` +
      `ts: ${createdAt}\n`;

    const c: Challenge = { nonce, userId: uid, walletPublicKey: w, message, createdAt, expiresAt };
    this.challengesByNonce.set(nonce, c);
    return c;
  }

  getWalletLinkByUser(userId: string): WalletLinkRecord | null {
    return this.walletLinksByUser.get(userId) ?? null;
  }

  linkWalletFromChallenge(params: {
    userId: string;
    walletPublicKey: string;
    nonce: string;
    signature: string;
  }): { user: UserRecord; link: WalletLinkRecord } {
    const userId = String(params.userId || "").trim();
    const walletPublicKey = String(params.walletPublicKey || "").trim();
    const nonce = String(params.nonce || "").trim();
    const signature = String(params.signature || "").trim();

    if (!userId) throw new Error("userId required");
    if (!walletPublicKey) throw new Error("walletPublicKey required");
    if (!nonce) throw new Error("nonce required");
    if (!signature) throw new Error("signature required");

    const c = this.challengesByNonce.get(nonce);
    if (!c) throw new Error("challenge not found");
    if (c.userId !== userId) throw new Error("challenge user mismatch");
    if (c.walletPublicKey !== walletPublicKey) throw new Error("challenge wallet mismatch");
    if (Date.now() > c.expiresAt) throw new Error("challenge expired");

    const pubkeyBytes = bs58.decode(walletPublicKey);
    const sigBytes = decodeSigFlexible(signature);
    const msgBytes = toBytesMessage(c.message);

    const ok = nacl.sign.detached.verify(msgBytes, sigBytes, pubkeyBytes);
    if (!ok) throw new Error("invalid signature");

    // mark verified on user (append-only update: write a new user snapshot line)
    const user = this.getUserById(userId);
    if (!user) throw new Error("user not found");

    const updated: UserRecord = {
      ...user,
      walletPublicKey, // keep as linked wallet
      walletVerified: true,
      walletVerifiedAt: Date.now(),
    };

    // update maps
    this.usersById.set(updated.id, updated);
    this.usersByWallet.set(updated.walletPublicKey, updated);
    appendJsonl(this.USERS_FILE, updated);

    const link: WalletLinkRecord = {
      id: genIdHex(12),
      userId,
      walletPublicKey,
      message: c.message,
      signature,
      nonce,
      createdAt: Date.now(),
      verified: true,
    };

    this.walletLinksByUser.set(userId, link);
    appendJsonl(this.WALLET_LINKS_FILE, link);

    // one-time use
    this.challengesByNonce.delete(nonce);

    return { user: updated, link };
  }
}

export const store = new FileBackedStore();
export type { FileBackedStore };
