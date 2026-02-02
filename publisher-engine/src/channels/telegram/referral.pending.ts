import path from "path";
import { promises as fs } from "fs";

type PendingStore = Record<string, { refCode: string; ts: string }>;

const DATA_DIR = path.resolve(process.cwd(), "data");
const PENDING_PATH = path.resolve(DATA_DIR, "pending_referrals.json");

async function readPending(): Promise<PendingStore> {
  try {
    const raw = await fs.readFile(PENDING_PATH, "utf8");
    return JSON.parse(raw) as PendingStore;
  } catch {
    return {};
  }
}

async function writePending(store: PendingStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(PENDING_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function setPendingReferral(joinerUserId: number, refCode: string): Promise<void> {
  const store = await readPending();
  store[String(joinerUserId)] = { refCode, ts: new Date().toISOString() };
  await writePending(store);
}

export async function popPendingReferral(joinerUserId: number): Promise<string | null> {
  const store = await readPending();
  const key = String(joinerUserId);
  const rec = store[key];
  if (!rec?.refCode) return null;
  delete store[key];
  await writePending(store);
  return rec.refCode;
}
