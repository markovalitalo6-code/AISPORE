import { ContentStore } from "../content/ContentStore";
import { PlannedPost } from "../core/types";

export function getDuePosts(store: ContentStore, now: Date): PlannedPost[] {
  const allPosts = store.getAllPosts();

  return allPosts.filter((post) => {
    const scheduledTime = new Date(post.scheduledAt);
    return scheduledTime <= now;
  });
}
