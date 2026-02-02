import { PlannedPost, PublisherConfig } from "../core/types";
import { publishToTelegram } from "../channels/telegram/TelegramPublisher";
import { publishToX } from "../channels/x/XPublisher";
import { logger } from "../core/logger";

export async function runPosts(
  posts: PlannedPost[],
  config: PublisherConfig
): Promise<void> {
  logger.info("Orchestrator starting", {
    count: posts.length,
    dryRun: config.dryRun
  });

  for (const post of posts) {
    try {
      if (post.channel === "tg" || post.channel === "both") {
        await publishToTelegram(post, config);
      }
      if (post.channel === "x" || post.channel === "both") {
        await publishToX(post, config);
      }

      logger.info("Post processed successfully", { postId: post.id });
    } catch (err) {
      logger.error("Post processing failed", {
        postId: post.id,
        error: String(err)
      });
    }
  }
}
