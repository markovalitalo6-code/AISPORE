import path from "path";
import { loadConfig } from "../core/config";
import { ContentStore } from "../content/ContentStore";
import { logger } from "../core/logger";

async function main() {
  console.log("\\n=== X TEST: CONFIG + CONTENT ===\\n");

  // 1) Lataa konfiguraatio (.env + config/publisher.config.json)
  const config = loadConfig();
  console.log("DryRun:", config.dryRun);
  console.log("Telegram chat ID:", config.telegramChatId || "(none)");
  console.log("X handle:", config.xHandle || "(none)");

  // 2) Lataa postit data-kansiosta
  const dataDir = path.join(process.cwd(), "data");
  const store = new ContentStore(dataDir);
  const posts = store.getAllPosts();

  console.log(`Loaded ${posts.length} planned posts.`);
  if (posts[0]) {
    console.log("First post ID:", posts[0].id);
    console.log("First post title:", posts[0].title);
    console.log("First post channel:", posts[0].channel);
    console.log("First post content:", posts[0].rawTemplate);
  }

  console.log("\\n=== X TEST DONE ===\\n");
}

main().catch((err) => {
  logger.error("X TEST ERROR", err);
});
