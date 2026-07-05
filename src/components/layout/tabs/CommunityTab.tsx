"use client";

import { Heart, Link2, MessageCircle } from "lucide-react";
import { useState } from "react";
import { shellCopy } from "@/components/layout/copy";

type FeedItem = {
  id: string;
  initials: string;
  summary: string;
  time: string;
  metric: string;
};

const feedItems: FeedItem[] = [
  {
    id: "you-check",
    initials: "You",
    summary: "You completed today’s mobility check",
    time: "This morning",
    metric: "4 min check",
  },
  {
    id: "mei-walk",
    initials: "M",
    summary: "Mei completed a 12 min walk",
    time: "1 hour ago",
    metric: "12 min",
  },
  {
    id: "raj-balance",
    initials: "R",
    summary: "Raj did balance practice",
    time: "Yesterday",
    metric: "8 min",
  },
];

/** Gentle, non-competitive community feed — encouragement, not leaderboards. */
export function CommunityTab() {
  const [kudos, setKudos] = useState<Record<string, boolean>>({});

  function toggleKudos(id: string) {
    setKudos((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <>
      <header className="top-bar">
        <h1 className="top-bar__title">{shellCopy.community.title}</h1>
      </header>
      <div className="app-content app-content--tabs">
        {/* Connect Strava setup card */}
        <section className="app-card grid gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-warm-soft)] text-[var(--accent-warm)]">
              <Link2 aria-hidden size={22} />
            </span>
            <div>
              <h2 className="text-[length:var(--text-body)] font-bold">Connect Strava</h2>
              <p className="text-[length:var(--text-label)] text-[var(--muted)]">
                Bring in walks and activity updates.
              </p>
            </div>
          </div>
          <button className="secondary-action w-full" type="button">
            Connect
          </button>
        </section>

        {/* Weekly challenge */}
        <section className="app-card app-card--hero grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[length:var(--text-body)] font-bold">3-day movement goal</h2>
            <p className="text-[length:var(--text-label)] font-bold text-[var(--muted)]">
              2 days left
            </p>
          </div>
          <p className="text-[length:var(--text-label)] text-[var(--muted)]">
            2 of 3 days this week — every gentle movement counts.
          </p>
          <div aria-hidden className="progress-track">
            <div className="progress-fill" style={{ width: "66%" }} />
          </div>
        </section>

        {/* Feed */}
        {feedItems.map((item) => (
          <article className="feed-card grid gap-3 border border-[var(--card-border)]" key={item.id}>
            <div className="flex items-center gap-3">
              <span aria-hidden className="avatar-dot">
                {item.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{item.summary}</p>
                <p className="text-[length:var(--text-label)] text-[var(--muted)]">
                  {item.time} · {item.metric}
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
                {kudos[item.id] ? "Cheered" : "Cheer"}
              </button>
              <button className="link-action" type="button">
                <MessageCircle aria-hidden size={16} />
                Comment
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
