import fs from "fs";
import path from "path";

const SRC = path.resolve(__dirname, "../data/rewards.jsonl");
const DST_DIR = path.resolve(
  process.env.HOME || "",
  "Library/Mobile Documents/com~apple~CloudDocs/AISPORE_BACKUP"
);

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const DST = path.join(DST_DIR, `rewards_${stamp}.jsonl`);

if (!fs.existsSync(SRC)) {
  console.log("No rewards file yet, nothing to back up.");
  process.exit(0);
}

fs.copyFileSync(SRC, DST);
console.log("Backup written to iCloud:", DST);

