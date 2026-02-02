import path from "path";
import { loadConfig } from "../core/config";
import { ContentStore } from "../content/ContentStore";

async function main() {
  console.log("\n🔍 DRY RUN PREVIEW 🔍\n");

  const config = loadConfig();
  const dataDir = path.join(process.cwd(), "data");
  const store = new ContentStore(dataDir);

  const posts = store.getAllPosts();

  console.log(`Found ${posts.length} total planned posts.\n`);

  posts.forEach((post) => {
    console.log("------------------------------------------------");
    console.log(`ID:        ${post.id}`);
    console.log(`Time:      ${post.scheduledAt}`);
    console.log(`Channel:   ${post.channel.toUpperCase()}`);
    console.log(`Content:   "${post.rawTemplate}"`);
    console.log(`Status:    ${config.dryRun ? "DRY RUN MODE" : "PRODUCTION"}`);
  });
  console.log("------------------------------------------------\n");
}

main().catch((err) => console.error(err));
