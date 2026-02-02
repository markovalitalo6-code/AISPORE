import path from "path";
import { promises as fs } from "fs";
import { atomicWriteJSON } from "../utils/atomicWrite";
import { getBadgeTier, type BadgeTier } from "../config/badges";

const BADGES_FILE = path.resolve(process.cwd(), "src", "data", "badges.json");

export interface UserBadgeData {
  userId: number;
  username?: string;
  inviteCount: number;
  currentTier: string;
  lastUpdated: string;
}

interface BadgesStore {
  users: Record<string, UserBadgeData>;
}

let cache: BadgesStore | null = null;

async function ensureBadgesFile(): Promise<void> {
  try {
    await fs.access(BADGES_FILE);
  } catch {
    await fs.mkdir(path.dirname(BADGES_FILE), { recursive: true });
    await atomicWriteJSON(BADGES_FILE, { users: {} } satisfies BadgesStore);
  }
}

async function loadStore(): Promise<BadgesStore> {
  if (cache) return cache;
  await ensureBadgesFile();
  const raw = await fs.readFile(BADGES_FILE, "utf8");
  cache = JSON.parse(raw) as BadgesStore;
  if (!cache.users) cache.users = {};
  return cache;
}

async function saveStore(store: BadgesStore): Promise<void> {
  await atomicWriteJSON(BADGES_FILE, store);
  cache = store;
}

export async function getUserBadgeData(userId: number): Promise<UserBadgeData> {
  const store = await loadStore();
  const key = String(userId);

  if (!store.users[key]) {
    const tier = getBadgeTier(0);
    store.users[key] = {
      userId,
      inviteCount: 0,
      currentTier: tier.name,
      lastUpdated: new Date().toISOString(),
    };
    await saveStore(store);
  }

  return store.users[key];
}

export async function incrementInvite(
  userId: number,
  username?: string
): Promise<{ oldTier: BadgeTier; newTier: BadgeTier; promoted: boolean }> {
  const store = await loadStore();
  const key = String(userId);

  if (!store.users[key]) {
    await getUserBadgeData(userId);
  }

  const user = store.users[key];
  const oldTier = getBadgeTier(user.inviteCount);

  user.inviteCount += 1;
  user.lastUpdated = new Date().toISOString();
  if (username) user.username = username;

  const newTier = getBadgeTier(user.inviteCount);
  user.currentTier = newTier.name;

  await saveStore(store);

  return { oldTier, newTier, promoted: oldTier.name !== newTier.name };
}

export async function getLeaderboard(limit = 10): Promise<UserBadgeData[]> {
  const store = await loadStore();
  return Object.values(store.users)
    .sort((a, b) => b.inviteCount - a.inviteCount)
    .slice(0, limit);
}
