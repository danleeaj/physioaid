"use client";

import {
  Building2,
  MapPin,
  Navigation,
  Phone,
  Search,
} from "lucide-react";
import { useState } from "react";
import { shellCopy } from "@/components/layout/copy";

export type ResourceSegment = "nearby" | "videos" | "clinics";

type ResourceCard = {
  id: string;
  segment: ResourceSegment;
  title: string;
  meta: string;
  actions: { label: string; icon: "directions" | "call" | "watch" }[];
};

const cards: ResourceCard[] = [
  {
    id: "aac",
    segment: "nearby",
    title: "Active Ageing Centre",
    meta: "0.8 km · Open today",
    actions: [{ label: "Directions", icon: "directions" }],
  },
  {
    id: "chair-video",
    segment: "videos",
    title: "Chair stand exercise",
    meta: "8 min · Beginner",
    actions: [{ label: "Watch", icon: "watch" }],
  },
  {
    id: "balance-video",
    segment: "videos",
    title: "Balance practice",
    meta: "8 min · Beginner",
    actions: [{ label: "Watch", icon: "watch" }],
  },
  {
    id: "physio-clinic",
    segment: "clinics",
    title: "Physio clinic",
    meta: "1.2 km",
    actions: [
      { label: "Call", icon: "call" },
      { label: "Directions", icon: "directions" },
    ],
  },
  {
    id: "ot-clinic",
    segment: "clinics",
    title: "OT clinic",
    meta: "2.4 km",
    actions: [
      { label: "Call", icon: "call" },
      { label: "Directions", icon: "directions" },
    ],
  },
];

const segments: { id: ResourceSegment; label: string }[] = [
  { id: "nearby", label: "Nearby" },
  { id: "videos", label: "Videos" },
  { id: "clinics", label: "Clinics" },
];

const actionIcons = {
  directions: Navigation,
  call: Phone,
  watch: null,
} as const;

/** Local-care discovery hub: nearby support, exercise videos, clinics.
 * Segment state lives in AppShell so home's "Open exercise" can deep-link. */
export function ResourcesTab({
  segment,
  onSegmentChange,
}: {
  segment: ResourceSegment;
  onSegmentChange: (segment: ResourceSegment) => void;
}) {
  const [query, setQuery] = useState("");

  const visible = cards.filter(
    (card) =>
      card.segment === segment &&
      (query.trim() === "" ||
        card.title.toLowerCase().includes(query.trim().toLowerCase())),
  );

  return (
    <>
      <header className="top-bar">
        <h1 className="top-bar__title">{shellCopy.resources.title}</h1>
      </header>
      <div className="app-content app-content--tabs">
        <label className="relative block">
          <span className="sr-only">{shellCopy.resources.searchPlaceholder}</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={20}
          />
          <input
            className="input-field pl-12"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={shellCopy.resources.searchPlaceholder}
            type="search"
            value={query}
          />
        </label>

        <div className="segmented" role="group" aria-label="Resource type">
          {segments.map((item) => (
            <button
              aria-pressed={segment === item.id}
              key={item.id}
              onClick={() => onSegmentChange(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        {visible.map((card) => (
          <article className="app-card grid gap-3" key={card.id}>
            {card.segment === "videos" ? (
              <div className="clip-cover">
                <span className="clip-play" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--primary-dark)]">
                  {card.segment === "nearby" ? (
                    <MapPin aria-hidden size={22} />
                  ) : (
                    <Building2 aria-hidden size={22} />
                  )}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-[length:var(--text-body)] font-bold">{card.title}</h2>
              <p className="text-[length:var(--text-label)] text-[var(--muted)]">{card.meta}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {card.actions.map((action) => {
                const Icon = actionIcons[action.icon];
                return (
                  <button
                    className="secondary-action !w-auto flex-1"
                    key={action.label}
                    type="button"
                  >
                    {Icon && <Icon aria-hidden size={18} />}
                    {action.label}
                  </button>
                );
              })}
            </div>
          </article>
        ))}

        {visible.length === 0 && (
          <p className="px-1 text-[var(--muted)]">
            No matches here yet. Try a different word or segment.
          </p>
        )}
      </div>
    </>
  );
}
