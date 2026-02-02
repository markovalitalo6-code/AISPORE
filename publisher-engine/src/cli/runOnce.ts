import path from "path";
import { loadConfig } from "../core/config";
import { ContentStore } from "../content/ContentStore";
import { getDuePosts } from "../scheduler/Scheduler";
import { runPosts } from "../orchestrator/Orchestrator";
import { logger } from "../core/logger";

async function main() {
  logger.info("=== CLI: Run Once ===");

  const config = loadConfig();
  const dataDir = path.join(process.cwd(), "data");
  const store = new ContentStore(dataDir);

  const now = new Date();
  const posts = getDuePosts(store, now);

  if (posts.length === 0) {
    logger.info("No posts due at this time.");
    return;
  }

  await runPosts(posts, config);

  logger.info("=== Run Once Complete ===");
}

main().catch((err) => logger.error("CLI Fatal Error", err));
