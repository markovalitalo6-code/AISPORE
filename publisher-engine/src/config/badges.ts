export interface BadgeTier {
  name: string;
  emoji: string;
  minInvites: number;
  maxInvites: number;
}

export const BADGE_TIERS: BadgeTier[] = [
  { name: "Bronze", emoji: "🥉", minInvites: 0, maxInvites: 4 },
  { name: "Silver", emoji: "🥈", minInvites: 5, maxInvites: 19 },
  { name: "Gold", emoji: "🥇", minInvites: 20, maxInvites: 49 },
  { name: "Diamond", emoji: "💎", minInvites: 50, maxInvites: Infinity },
];

export function getBadgeTier(invites: number): BadgeTier {
  const found = BADGE_TIERS.find(
    (tier) => invites >= tier.minInvites && invites <= tier.maxInvites
  );
  return found ?? BADGE_TIERS[0];
}

export function getNextTier(currentTier: BadgeTier): BadgeTier | null {
  const currentIndex = BADGE_TIERS.findIndex((t) => t.name === currentTier.name);
  return currentIndex >= 0 && currentIndex < BADGE_TIERS.length - 1
    ? BADGE_TIERS[currentIndex + 1]
    : null;
}
