/**
 * DEMONSTRATION DATA — fictional, non-clinical.
 * Community posts, activities, and clips shown in the engagement layer are
 * invented for the demo. No health claims are made or implied.
 */

export type CommunityPost = {
  id: string;
  author: string;
  location: string;
  timeAgo: string;
  body: string;
  activity: string;
  cheers: number;
};

export type CommunityActivity = {
  id: string;
  title: string;
  venue: string;
  schedule: string;
  spots: string;
};

export type TrainerClip = {
  id: string;
  title: string;
  duration: string;
  coach: string;
};

export type WeeklySummary = {
  activeDays: number;
  targetDays: number;
  chairStandStreakDays: number;
  walksThisWeek: number;
  cheersReceived: number;
};

export const weeklySummary: WeeklySummary = {
  activeDays: 4,
  targetDays: 5,
  chairStandStreakDays: 14,
  walksThisWeek: 3,
  cheersReceived: 12,
};

export const communityPosts: CommunityPost[] = [
  {
    id: "post-1",
    author: "Mdm Ong",
    location: "Tampines",
    timeAgo: "2h ago",
    body: "Finished our morning loop at the Park Connector — cool breeze today! Same time on Thursday?",
    activity: "Tampines Park Connector walking group · 2.4 km",
    cheers: 8,
  },
  {
    id: "post-2",
    author: "Uncle Lim",
    location: "Bedok",
    timeAgo: "5h ago",
    body: "Day 14 of my daily chair stand practice. Legs feeling steadier on the stairs already.",
    activity: "Chair-stand streak · day 14",
    cheers: 15,
  },
  {
    id: "post-3",
    author: "Mrs Krishnan",
    location: "Toa Payoh",
    timeAgo: "yesterday",
    body: "First Tai Chi session at the Active Ageing Centre — everyone was so welcoming. Joining the Tuesday group!",
    activity: "Morning Tai Chi · Bedok AAC",
    cheers: 11,
  },
];

export const communityActivities: CommunityActivity[] = [
  {
    id: "activity-1",
    title: "Morning Tai Chi",
    venue: "Bedok Active Ageing Centre",
    schedule: "Tue & Thu · 8.00am",
    spots: "6 spots left",
  },
  {
    id: "activity-2",
    title: "Steady Steps walking group",
    venue: "Tampines Park Connector",
    schedule: "Mon, Wed, Fri · 7.30am",
    spots: "Open group",
  },
  {
    id: "activity-3",
    title: "Strength & balance class",
    venue: "Ang Mo Kio Community Health Post",
    schedule: "Sat · 9.00am",
    spots: "4 spots left",
  },
];

export const trainerClips: TrainerClip[] = [
  {
    id: "clip-1",
    title: "Standing tall from a chair",
    duration: "0:45",
    coach: "Coach Siti",
  },
  {
    id: "clip-2",
    title: "Gentle balance practice at the kitchen counter",
    duration: "1:20",
    coach: "Coach Marcus",
  },
  {
    id: "clip-3",
    title: "Warming up before your morning walk",
    duration: "0:58",
    coach: "Coach Devi",
  },
];
