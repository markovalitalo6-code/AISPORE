import crypto from "crypto";

/** -------- TYPES -------- */

export type UserRecord = {
  id: string;
  walletPublicKey: string;
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

function genIdHex(bytes = 12) {
  return crypto.randomBytes(bytes).toString("hex");
}

/** -------- STORE -------- */

class InMemoryStore {
  // USERS
  private usersById = new Map<string, UserRecord>();
  private usersByWallet = new Map<string, UserRecord>();

  // REWARDS (one lock per week)
  private rewardsByWeek = new Map<string, RewardRecord>();
  private rewardsById = new Map<string, RewardRecord>();

  /** AUTH: identify wallet -> returns existing or creates a new user */
  identify(walletPublicKey: string): UserRecord {
    const key = String(walletPublicKey || "").trim();
    if (!key) {
      throw new Error("walletPublicKey required");
    }

    const existing = this.usersByWallet.get(key);
    if (existing) return existing;

    const user: UserRecord = {
      id: genIdHex(12),
      walletPublicKey: key,
      createdAt: Date.now(),
    };

    this.usersById.set(user.id, user);
    this.usersByWallet.set(user.walletPublicKey, user);
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
    // idempotency: one record per week
    const existing = this.rewardsByWeek.get(input.week);
    if (existing) return existing;

    const record: RewardRecord = {
      ...input,
      id: genIdHex(12),
      createdAt: Date.now(),
    };

    this.rewardsByWeek.set(record.week, record);
    this.rewardsById.set(record.id, record);
    return record;
  }
}

export const store = new InMemoryStore();
export type { InMemoryStore };

