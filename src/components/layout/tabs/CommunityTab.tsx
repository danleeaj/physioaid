"use client";

import { Heart, MapPin, MessageCircle } from "lucide-react";
import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { activeDaysThisWeek, loadPracticeLog } from "@/lib/streak";

type FeedSegment = "nearby" | "friends" | "groups";

type FeedItem = {
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
 * supportive, never a leaderboard. Demo data only for now; a real feed would
 * come from opted-in community activity.
 */
const feedItems: FeedItem[] = [
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

const segments: { id: FeedSegment; labelKey: "shell.communityTab.segNearby" | "shell.communityTab.segFriends" | "shell.communityTab.segGroups" }[] = [
  { id: "nearby", labelKey: "shell.communityTab.segNearby" },
  { id: "friends", labelKey: "shell.communityTab.segFriends" },
  { id: "groups", labelKey: "shell.communityTab.segGroups" },
];

const WEEKLY_GOAL_DAYS = 3;

function daysLeftThisWeek(): number {
  // Monday-based week to match activeDaysThisWeek in lib/streak.
  return 7 - ((new Date().getDay() + 6) % 7) - 1;
}

/** Gentle neighbourhood community feed for older adults — encouragement, not competition. */
export function CommunityTab() {
  const { t } = useLanguage();
  const [kudos, setKudos] = useState<Record<string, boolean>>({});
  const [segment, setSegment] = useState<FeedSegment>("nearby");
  // Real device-local movement log (lazy init; [] on the server render).
  const [activeDays] = useState(() =>
    typeof window === "undefined" ? 0 : activeDaysThisWeek(loadPracticeLog()),
  );

  const goalDays = Math.min(activeDays, WEEKLY_GOAL_DAYS);
  const daysLeft = daysLeftThisWeek();
  const visible = feedItems.filter((item) => item.segments.includes(segment));

  function toggleKudos(id: string) {
    setKudos((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <>
      <header className="top-bar">
        <h1 className="top-bar__title">{t("shell.communityTab.title")}</h1>
      </header>
      <div className="app-content app-content--tabs">
        {/* Weekly movement goal — real device-local practice log */}
        <section className="app-card app-card--hero grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[length:var(--text-body)] font-bold">
              {t("shell.communityTab.goalTitle", { days: WEEKLY_GOAL_DAYS })}
            </h2>
            <p className="text-[length:var(--text-label)] font-bold text-[var(--muted)]">
              {goalDays >= WEEKLY_GOAL_DAYS
                ? t("shell.communityTab.goalReached")
                : t("shell.communityTab.daysLeft", { count: daysLeft })}
            </p>
          </div>
          <p className="text-[length:var(--text-label)] text-[var(--muted)]">
            {t("shell.communityTab.goalProgress", {
              done: goalDays,
              total: WEEKLY_GOAL_DAYS,
            })}
          </p>
          <div aria-hidden className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.round((goalDays / WEEKLY_GOAL_DAYS) * 100)}%` }}
            />
          </div>
        </section>

        {/* Segments */}
        <div className="segmented" role="group" aria-label="Feed filter">
          {segments.map((item) => (
            <button
              aria-pressed={segment === item.id}
              key={item.id}
              onClick={() => setSegment(item.id)}
              type="button"
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>

        {/* Fictional sample feed until a real community backend exists */}
        <p className="flex items-center gap-2 px-1 text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
          <FlaskConical aria-hidden size={12} />
          {t("shell.sample.pill")} · {t("community.demoNote")}
        </p>

        {/* Neighbourhood feed */}
        {visible.map((item) => (
          <article className="feed-card grid gap-3 border border-[var(--card-border)]" key={item.id}>
            <div className="flex items-center gap-3">
              <span aria-hidden className="avatar-dot">
                {item.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {item.name} {item.activity}
                </p>
                <p className="flex flex-wrap items-center gap-x-2 text-[length:var(--text-label)] text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1">
                    <MapPin aria-hidden size={14} />
                    {item.neighbourhood}
                  </span>
                  · {item.time} · {item.metric}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-pressed={Boolean(kudos[item.id])}
                className="cheer-button"
                data-cheered={kudos[item.id] ? "true" : undefined}
                onClick={() => toggleKudos(item.id)}
                type="button"
              >
                <Heart aria-hidden size={16} />
                {kudos[item.id] ? t("community.cheered") : t("community.cheer")}
              </button>
              <button className="link-action" type="button">
                <MessageCircle aria-hidden size={16} />
                {t("shell.communityTab.comment")}
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
