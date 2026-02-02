import { readBadges, writeBadges } from "./referral.utils";

export type BadgeLevel = "Bronze" | "Silver" | "Gold" | "Diamond";

export interface BadgeRecord {
  userId: number;
  username?: string;
  refCode: string;
  invites: number;
  joinedAt: string;
  badgeLevel: BadgeLevel;
}

type BadgesStore = Record<string, BadgeRecord>;

function computeBadge(invites: number): BadgeLevel {
  if (invites >= 20) return "Diamond";
  if (invites >= 8) return "Gold";
  if (invites >= 3) return "Silver";
  return "Bronze";
}

async function loadStore(): Promise<BadgesStore> {
  const raw = (await readBadges()) as any;
  return (raw || {}) as BadgesStore;
}

async function saveStore(store: BadgesStore): Promise<void> {
  await writeBadges(store as any);
}

export async function ensureUserRecord(
  userId: number,
  username?: string
): Promise<BadgeRecord> {
  const store = await loadStore();
  const key = String(userId);

  let rec = store[key];

  if (!rec) {
    const refCode = `ref_${userId}_${Math.random().toString(36).slice(2, 9)}`;
    rec = {
      userId,
      username,
      refCode,
      invites: 0,
      joinedAt: new Date().toISOString(),
      badgeLevel: "Bronze",
    };
    store[key] = rec;
  } else {
    if (!rec.refCode) {
      rec.refCode = `ref_${userId}_${Math.random().toString(36).slice(2, 9)}`;
    }
    if (typeof rec.invites !== "number") {
      rec.invites = 0;
    }
    if (!rec.badgeLevel) {
      rec.badgeLevel = computeBadge(rec.invites);
    }
    if (username && !rec.username) {
      rec.username = username;
    }
    store[key] = rec;
  }

  await saveStore(store);
  return rec;
}

export async function getUserBadgeRecord(
  userId: number
): Promise<BadgeRecord | undefined> {
  const store = await loadStore();
  const key = String(userId);
  return store[key];
}

export async function saveUserBadgeRecord(rec: BadgeRecord): Promise<void> {
  const store = await loadStore();
  const key = String(rec.userId);
  store[key] = rec;
  await saveStore(store);
}

export async function onReferralUsed(
  inviterUserId: number
): Promise<BadgeRecord | undefined> {
  const store = await loadStore();
  const key = String(inviterUserId);
  const rec = store[key];

  if (!rec) return undefined;

  rec.invites = (rec.invites ?? 0) + 1;
  rec.badgeLevel = computeBadge(rec.invites);
  store[key] = rec;

  await saveStore(store);
  return rec;
}

export async function getLeaderboard(
  limit: number = 10
): Promise<BadgeRecord[]> {
  const store = await loadStore();
  const records = Object.values(store);

  records.sort((a, b) => {
    if (b.invites !== a.invites) return b.invites - a.invites;
    return a.joinedAt.localeCompare(b.joinedAt);
  });

  return records.slice(0, limit);
}


export async function findInviterUserIdByRefCode(refCode: string): Promise<number | null> {
  const store = await loadStore();
  for (const rec of Object.values(store)) {
    if (rec && typeof (rec as any).refCode === "string" && (rec as any).refCode === refCode) {
      return (rec as any).userId ?? null;
    }
  }
  return null;
}
