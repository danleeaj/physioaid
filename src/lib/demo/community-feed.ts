/**
 * DEMONSTRATION DATA — fictional, non-clinical.
 * Sample neighbourhood feed shown only in demo mode (`isDemo`) on the
 * Community tab. Moved out of `CommunityTab.tsx` (Goal 7) so the component
 * can distinguish "sample content" from the real, opted-in feed. This file
 * is separate from `src/lib/demo/community.ts`, which the
 * `/api/recommend-activities` route imports — do not merge them.
 */

export type FeedSegment = "nearby" | "friends" | "groups";

export type FeedItem = {
  id: string;
  initials: string;
  name: string;
  activity: string;
  neighbourhood: string;
  time: string;
  metric: string;
  segments: FeedSegment[];
};

/**
 * Neighbourhood activity feed — updates from older adults nearby. Local and
 * supportive, never a leaderboard. Demo data only; the real feed (Goal 7)
 * shows opted-in community activity, currently empty for everyone.
 */
export const feedItems: FeedItem[] = [
  {
    id: "wong-check",
    initials: "W",
    name: "Mr Wong",
    activity: "completed today’s mobility check",
    neighbourhood: "Toa Payoh",
    time: "This morning",
    metric: "4 min check",
    segments: ["nearby", "friends"],
  },
  {
    id: "mei-walk",
    initials: "M",
    name: "Mei",
    activity: "completed a 12 min walk at the park connector",
    neighbourhood: "Toa Payoh",
    time: "1 hour ago",
    metric: "12 min",
    segments: ["nearby", "friends"],
  },
  {
    id: "lim-chair",
    initials: "L",
    name: "Auntie Lim",
    activity: "joined chair exercise at the Active Ageing Centre",
    neighbourhood: "Toa Payoh",
    time: "2 hours ago",
    metric: "Group session",
    segments: ["nearby", "groups"],
  },
  {
    id: "raj-balance",
    initials: "R",
    name: "Raj",
    activity: "did 8 min balance practice",
    neighbourhood: "Bishan",
    time: "Yesterday",
    metric: "8 min",
    segments: ["nearby", "friends"],
  },
];

export const feedSegments: { id: FeedSegment; label: string }[] = [
  { id: "nearby", label: "Nearby" },
  { id: "friends", label: "Friends" },
  { id: "groups", label: "Groups" },
];
