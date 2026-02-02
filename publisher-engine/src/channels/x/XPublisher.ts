import { PlannedPost, PublisherConfig } from "../../core/types";
import { logger } from "../../core/logger";

export async function publishToX(
  post: PlannedPost,
  config: PublisherConfig
): Promise<void> {
  if (config.dryRun) {
    logger.info("[DRY-RUN] [X] Would publish tweet", {
      title: post.title,
      content: post.rawTemplate
    });
    return;
  }

  logger.warn("Real X publishing not implemented yet");
}
