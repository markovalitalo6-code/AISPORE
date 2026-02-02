import fs from "fs";
import path from "path";
import { Campaign, PlannedPost } from "../core/types";
import { logger } from "../core/logger";

export class ContentStore {
  private campaigns: Campaign[] = [];
  private posts: PlannedPost[] = [];
  private basePath: string;

  constructor(dataDir: string) {
    this.basePath = dataDir;
    this.loadData();
  }

  private loadData() {
    try {
      const campaignsPath = path.join(this.basePath, "campaigns.example.json");
      const postsPath = path.join(this.basePath, "posts.example.json");

      if (fs.existsSync(campaignsPath)) {
        this.campaigns = JSON.parse(fs.readFileSync(campaignsPath, "utf-8"));
      }

      if (fs.existsSync(postsPath)) {
        this.posts = JSON.parse(fs.readFileSync(postsPath, "utf-8"));
      }

      logger.info(
        "Loaded campaigns and posts",
        { campaigns: this.campaigns.length, posts: this.posts.length }
      );
    } catch (err) {
      logger.error("Failed to load content data", err);
    }
  }

  getActiveCampaigns(): Campaign[] {
    return this.campaigns.filter((c) => c.isActive);
  }

  getAllPosts(): PlannedPost[] {
    return this.posts;
  }
}
