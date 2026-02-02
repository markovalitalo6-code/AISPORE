import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { PublisherConfig } from "./types";
import { logger } from "./logger";

dotenv.config();

export function loadConfig(): PublisherConfig {
  const configPath = path.join(process.cwd(), "config", "publisher.config.json");
  let jsonConfig: Partial<PublisherConfig> = {};

  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      jsonConfig = JSON.parse(raw);
    }
  } catch (error) {
    logger.error("Failed to load publisher.config.json", error);
  }

  const isDryRunEnv = process.env.PUBLISHER_DRY_RUN === "true";

  return {
    dryRun:
      process.env.PUBLISHER_DRY_RUN !== undefined
        ? isDryRunEnv
        : jsonConfig.dryRun ?? true,
    defaultTimezone: jsonConfig.defaultTimezone || "Europe/Helsinki",
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    xHandle: process.env.X_HANDLE
  };
}
