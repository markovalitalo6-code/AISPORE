import crypto from "crypto";

export interface User {
  userId: string;
  walletPublicKey: string;
  tickets: number | null;
  raffleEntryId: string | null;
}

type UserId = string;
type Wallet = string;

class InMemoryStore {
  private usersById = new Map<UserId, User>();
  private userIdByWallet = new Map<Wallet, UserId>();

  makeUserId(walletPublicKey: string): string {
    return crypto
      .createHash("sha256")
      .update(walletPublicKey)
      .digest("hex");
  }

  getUserById(userId: string): User | null {
    return this.usersById.get(userId) ?? null;
  }

  getUserByWallet(walletPublicKey: string): User | null {
    const id = this.userIdByWallet.get(walletPublicKey);
    return id ? this.usersById.get(id) ?? null : null;
  }

  identify(walletPublicKey: string): User {
    const existing = this.getUserByWallet(walletPublicKey);
    if (existing) return existing;

    const userId = this.makeUserId(walletPublicKey);

    const user: User = {
      userId,
      walletPublicKey,
      tickets: null,
      raffleEntryId: null,
    };

    this.usersById.set(userId, user);
    this.userIdByWallet.set(walletPublicKey, userId);

    return user;
  }
}

export const store = new InMemoryStore();

