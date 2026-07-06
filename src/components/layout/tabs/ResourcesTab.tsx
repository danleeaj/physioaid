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
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { shellCopy } from "@/components/layout/copy";
import { clinicTypeLabel, type Clinic } from "@/lib/demo/clinics";
import type { RiskCategory, TestId } from "@/types/assessment";

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

type RecommendedClinic = Clinic & { why?: string };

type ClinicSuggestions = {
  source: "ai" | "curated";
  clinics: RecommendedClinic[];
};

/** Local-care discovery hub: nearby support, exercise videos, clinics.
 * Segment state lives in AppShell so home's "Open exercise" can deep-link. */
export function ResourcesTab({
  segment,
  onSegmentChange,
  latestRisk,
  latestSession,
}: {
  segment: ResourceSegment;
  onSegmentChange: (segment: ResourceSegment) => void;
  /** Coarse risk band from the latest history entry — the only profile hint sent to the API. */
  latestRisk?: RiskCategory | null;
  /** Anonymous test/concern context from the most recent assessment. */
  latestSession?: {
    testsCompleted: TestId[];
    concerns: string[];
  } | null;
}) {
  const { isDemo, profile } = useUserProfile();
  const { lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [suggestionsFailed, setSuggestionsFailed] = useState(false);
  const [clinicSuggestions, setClinicSuggestions] = useState<ClinicSuggestions | null>(null);
  const [clinicsFailed, setClinicsFailed] = useState(false);

  // Demo keeps the Toa Payoh story; real users only ever send their own
  // planning area — or none at all (the API handles a missing area).
  const area = isDemo ? "Toa Payoh" : (profile?.planningArea ?? null);

  // Fetch AI/curated activity suggestions when the Nearby segment is open.
  useEffect(() => {
    if (segment !== "nearby" || suggestions || suggestionsFailed) return;
    let cancelled = false;
    const params = new URLSearchParams();
    if (area) params.set("area", area);
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

  // Fetch AI/curated clinic recommendations when the Clinics segment is open.
  useEffect(() => {
    if (segment !== "clinics" || clinicSuggestions || clinicsFailed) return;
    let cancelled = false;
    fetch("/api/recommend-clinics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        area,
        riskCategory: latestRisk ?? null,
        testsCompleted: latestSession?.testsCompleted ?? [],
        concerns: latestSession?.concerns ?? [],
      }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled) return;
        if (payload && Array.isArray(payload.clinics)) {
          setClinicSuggestions({
            source: payload.source === "ai" ? "ai" : "curated",
            clinics: payload.clinics,
          });
        } else {
          setClinicsFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setClinicsFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [segment, clinicSuggestions, clinicsFailed, latestRisk, latestSession, area]);

  const visible = cards.filter(
    (card) =>
      card.segment === segment &&
      (query.trim() === "" ||
        card.title.toLowerCase().includes(query.trim().toLowerCase())),
  );

  return (
    <>
      <header className="top-bar">
        <h1 className="top-bar__title">{shellCopy[lang].resources.title}</h1>
      </header>
      <div className="app-content app-content--tabs">
        <label className="relative block">
          <span className="sr-only">{shellCopy[lang].resources.searchPlaceholder}</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={20}
          />
          <input
            className="input-field pl-12"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={shellCopy[lang].resources.searchPlaceholder}
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

        {/* Suggested for you — AI-ranked when OPENAI_API_KEY is configured */}
        {segment === "nearby" && suggestions && suggestions.activities.length > 0 && (
          <section className="grid grid-cols-1 gap-2">
            <h2 className="flex items-center gap-2 px-1 text-[length:var(--text-body)] font-bold">
              <Sparkles aria-hidden className="text-[var(--accent-warm)]" size={18} />
              Suggested for you
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
                {suggestions.source === "ai" ? "AI-suggested" : "Curated"}
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
              Suggestions are decision support only, not medical advice.
            </p>
          </section>
        )}

        {/* AI-recommended clinics */}
        {segment === "clinics" && clinicSuggestions && clinicSuggestions.clinics.length > 0 && (
          <section className="grid grid-cols-1 gap-2">
            <h2 className="flex items-center gap-2 px-1 text-[length:var(--text-body)] font-bold">
              <Sparkles aria-hidden className="text-[var(--accent-warm)]" size={18} />
              Recommended for you
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
                {clinicSuggestions.source === "ai" ? "AI-suggested" : "Curated"}
              </span>
            </h2>
            {clinicSuggestions.clinics.map((clinic) => (
              <article className="app-card grid gap-3" key={clinic.id}>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--primary-dark)]">
                    <Building2 aria-hidden size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[length:var(--text-body)] font-bold">{clinic.name}</h3>
                    <p className="text-[length:var(--text-label)] text-[var(--muted)]">
                      {clinicTypeLabel(clinic.type)} · {clinic.area}
                    </p>
                  </div>
                </div>
                {clinic.why && (
                  <p className="text-[length:var(--text-label)] text-[var(--muted-strong)]">
                    {clinic.why}
                  </p>
                )}
                <p className="text-[length:var(--text-caption)] text-[var(--muted)]">
                  {clinic.hours}
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    className="secondary-action !w-auto flex-1"
                    href={`tel:${clinic.phone}`}
                  >
                    <Phone aria-hidden size={18} />
                    Call
                  </a>
                  <a
                    className="secondary-action !w-auto flex-1"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address)}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Navigation aria-hidden size={18} />
                    Directions
                  </a>
                </div>
              </article>
            ))}
            <p className="px-1 text-[length:var(--text-caption)] text-[var(--muted)]">
              Clinic suggestions are decision support only, not medical advice.
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
                    className="secondary-action inline-action flex-1"
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

        {segment === "clinics" && !clinicSuggestions && !clinicsFailed && (
          <p className="px-1 text-[var(--muted)]">Finding clinics near you…</p>
        )}

        {visible.length === 0 && segment !== "clinics" && (
          <p className="px-1 text-[var(--muted)]">
            No matches here yet. Try a different word or segment.
          </p>
        )}

        {/* Planner view — clearly labelled, opens the standalone route */}
        <section className="quiet-card flex items-center gap-3 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--muted-strong)]">
            <BarChart3 aria-hidden size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[length:var(--text-body)] font-bold">
              Population insights (demo)
            </h2>
            <p className="text-[length:var(--text-label)] text-[var(--muted)]">
              For planners: neighbourhood screening trends.
            </p>
          </div>
          <Link className="link-action shrink-0" href="/insights">
            Open
          </Link>
        </section>
      </div>
    </>
  );
}
