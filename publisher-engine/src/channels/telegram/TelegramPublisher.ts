import { PlannedPost, PublisherConfig } from "../../core/types";
import { logger } from "../../core/logger";

export async function publishToTelegram(
  post: PlannedPost,
  config: PublisherConfig
): Promise<void> {
  if (config.dryRun) {
    logger.info("[DRY-RUN] [TG] Would publish", {
      chatId: config.telegramChatId || "N/A",
      title: post.title,
      content: post.rawTemplate
    });
    return;
  }

  logger.warn("Real Telegram publishing not implemented yet");
}
