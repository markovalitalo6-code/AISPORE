export type Channel = "tg" | "x" | "both";

export interface MediaAsset {
  id: string;
  type: "image" | "video" | "audio" | "other";
  url: string;
  caption?: string;
}

export interface PlannedPost {
  id: string;
  campaignId: string;
  title: string;
  rawTemplate: string;
  channel: Channel;
  scheduledAt: string;
  tags?: string[];
  media?: MediaAsset[];
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  posts: PlannedPost[];
}

export interface RunLog {
  id: string;
  plannedPostId: string;
  channel: Channel;
  status: "success" | "failed" | "skipped";
  timestamp: string;
  errorDetails?: string;
}

export interface PublisherConfig {
  dryRun: boolean;
  defaultTimezone: string;
  telegramChatId?: string;
  xHandle?: string;
}
