import path from "path";
import { promises as fs } from "fs";

type BadgesStore = Record<string, any>;

const DATA_DIR = path.resolve(process.cwd(), "data");
const BADGES_PATH = path.resolve(DATA_DIR, "badges.json");

export async function ensureBadgesFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(BADGES_PATH);
  } catch {
    await fs.writeFile(BADGES_PATH, JSON.stringify({}), "utf8");
  }
}

export async function readBadges(): Promise<BadgesStore> {
  try {
    const content = await fs.readFile(BADGES_PATH, "utf8");
    return JSON.parse(content) as BadgesStore;
  } catch {
    return {};
  }
}

export async function writeBadges(data: BadgesStore): Promise<void> {
  await fs.writeFile(BADGES_PATH, JSON.stringify(data, null, 2), "utf8");
}
