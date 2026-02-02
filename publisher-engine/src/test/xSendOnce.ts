import { TwitterApi } from "twitter-api-v2";
import path from "path";
import dotenv from "dotenv";
import { ContentStore } from "../content/ContentStore";
import { logger } from "../core/logger";

dotenv.config();

async function main() {
  console.log("\\n=== X SEND ONCE: FIRST AISPORE POST ===\\n");

  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    throw new Error(
      "Missing X API credentials in .env (X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET)"
    );
  }

  const client = new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken,
    accessSecret,
  });

  const dataDir = path.join(process.cwd(), "data");
  const store = new ContentStore(dataDir);
  const posts = store.getAllPosts().filter((p) => p.channel === "x");

  if (posts.length === 0) {
    console.log("No X posts found in data/posts.example.json");
    return;
  }

  const post = posts[0];

  console.log("Sending post:", post.id, "-", post.title);
  console.log("\\nPreview:\\n");
  console.log(post.rawTemplate);
  console.log("\\nIf this script runs to the end, it will POST this text to @AiSpore.\\n");

  const res = await client.v2.tweet(post.rawTemplate);

  console.log("\\nTweet sent. Twitter response id:", res.data.id);
  console.log("\\n=== X SEND ONCE DONE ===\\n");
}

main().catch((err) => {
  logger.error("X SEND ONCE ERROR", err);
  process.exit(1);
});
