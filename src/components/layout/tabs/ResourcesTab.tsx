"use client";

import {
  BarChart3,
  Building2,
  CalendarDays,
  MapPin,
  Navigation,
  Phone,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { RiskCategory } from "@/types/assessment";

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

const segments: { id: ResourceSegment; labelKey: "shell.resources.segNearby" | "shell.resources.segVideos" | "shell.resources.segClinics" }[] = [
  { id: "nearby", labelKey: "shell.resources.segNearby" },
  { id: "videos", labelKey: "shell.resources.segVideos" },
  { id: "clinics", labelKey: "shell.resources.segClinics" },
];

const actionIcons = {
  directions: Navigation,
  call: Phone,
  watch: null,
} as const;

type SuggestedActivity = {
  id: string;
  title: string;
  venue: string;
  schedule: string;
  spots: string;
  area: string;
  why?: string;
};

type Suggestions = {
  source: "ai" | "curated-demo";
  activities: SuggestedActivity[];
};

/** Local-care discovery hub: nearby support, exercise videos, clinics.
 * Segment state lives in AppShell so home's "Open exercise" can deep-link. */
export function ResourcesTab({
  segment,
  onSegmentChange,
  latestRisk,
  area,
}: {
  segment: ResourceSegment;
  onSegmentChange: (segment: ResourceSegment) => void;
  /** Coarse risk band from the latest history entry — the only profile hint sent to the API. */
  latestRisk?: RiskCategory | null;
  /** The user's neighbourhood (profile) — anchors nearby suggestions. */
  area?: string | null;
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [suggestionsFailed, setSuggestionsFailed] = useState(false);

  // Fetch AI/curated activity suggestions when the Nearby segment is open.
  useEffect(() => {
    if (segment !== "nearby" || suggestions || suggestionsFailed) return;
    let cancelled = false;
    const params = new URLSearchParams({ area: area ?? "Toa Payoh" });
    if (latestRisk) params.set("risk", latestRisk);
    fetch(`/api/recommend-activities?${params.toString()}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled) return;
        if (payload && Array.isArray(payload.activities)) {
          setSuggestions({
            source: payload.source === "ai" ? "ai" : "curated-demo",
            activities: payload.activities,
          });
        } else {
          setSuggestionsFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestionsFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [segment, suggestions, suggestionsFailed, latestRisk, area]);

  const visible = cards.filter(
    (card) =>
      card.segment === segment &&
      (query.trim() === "" ||
        card.title.toLowerCase().includes(query.trim().toLowerCase())),
  );

  return (
    <>
      <header className="top-bar">
        <h1 className="top-bar__title">{t("shell.resources.title")}</h1>
      </header>
      <div className="app-content app-content--tabs">
        <label className="relative block">
          <span className="sr-only">{t("shell.resources.searchPlaceholder")}</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={20}
          />
          <input
            className="input-field pl-12"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("shell.resources.searchPlaceholder")}
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
              {t(item.labelKey)}
            </button>
          ))}
        </div>

        {/* Suggested for you — AI-ranked when OPENAI_API_KEY is configured */}
        {segment === "nearby" && suggestions && suggestions.activities.length > 0 && (
          <section className="grid grid-cols-1 gap-2">
            <h2 className="flex items-center gap-2 px-1 text-[length:var(--text-body)] font-bold">
              <Sparkles aria-hidden className="text-[var(--accent-warm)]" size={18} />
              {t("shell.resources.suggestedTitle")}
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
                {suggestions.source === "ai" ? t("shell.resources.suggestedAI") : t("shell.resources.suggestedCurated")}
              </span>
            </h2>
            {suggestions.activities.map((activity) => (
              <article className="app-card grid gap-1" key={activity.id}>
                <h3 className="text-[length:var(--text-body)] font-bold">
                  {activity.title}
                </h3>
                <p className="flex flex-wrap items-center gap-x-2 text-[length:var(--text-label)] text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1">
                    <MapPin aria-hidden size={14} />
                    {activity.venue}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays aria-hidden size={14} />
                    {activity.schedule}
                  </span>
                </p>
                {activity.why && (
                  <p className="text-[length:var(--text-label)] text-[var(--muted-strong)]">
                    {activity.why}
                  </p>
                )}
              </article>
            ))}
            <p className="px-1 text-[length:var(--text-caption)] text-[var(--muted)]">
              {t("shell.resources.suggestedNote")}
            </p>
          </section>
        )}

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
            {t("shell.resources.empty")}
          </p>
        )}

        {/* Planner view — clearly labelled, opens the standalone route */}
        <section className="quiet-card flex items-center gap-3 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--muted-strong)]">
            <BarChart3 aria-hidden size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[length:var(--text-body)] font-bold">
              {t("shell.resources.plannerTitle")}
            </h2>
            <p className="text-[length:var(--text-label)] text-[var(--muted)]">
              {t("shell.resources.plannerBody")}
            </p>
          </div>
          <Link className="link-action shrink-0" href="/insights">
            {t("shell.resources.plannerOpen")}
          </Link>
        </section>
      </div>
    </>
  );
}
