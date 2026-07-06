"use client";

import { Activity, FlaskConical, Heart, MapPin, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { useMovementLog } from "@/components/community/useMovementLog";
import type { HistorySession } from "@/components/dashboard/history-store";
import { shellCopy } from "@/components/layout/copy";
import {
  feedItems,
  feedSegments,
  type FeedSegment,
} from "@/lib/demo/community-feed";
import type { MovementActivityLog } from "@/types/movement";

const copy = shellCopy.community;

const WEEKLY_GOAL_DAYS = 3;
const WALK_DURATION_OPTIONS = [
  { minutes: 10, label: copy.walkDuration10 },
  { minutes: 20, label: copy.walkDuration20 },
  { minutes: 30, label: copy.walkDuration30 },
] as const;

function daysLeftThisWeek(): number {
  // Monday-based week to match getActiveDaysThisWeek in lib/movement-log.
  return 7 - ((new Date().getDay() + 6) % 7) - 1;
}

/** Start (local midnight) of the current Monday-based week. */
function startOfCurrentWeek(): Date {
  const now = new Date();
  const monday = new Date(now);
  const dayOffset = (now.getDay() + 6) % 7;
  monday.setDate(now.getDate() - dayOffset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function logsThisWeek(logs: MovementActivityLog[]): MovementActivityLog[] {
  const monday = startOfCurrentWeek();
  const now = new Date();
  return logs.filter((log) => {
    const date = new Date(log.completedAt);
    return date >= monday && date <= now;
  });
}

function weekdayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-SG", { weekday: "long" });
}

/** Sample pill shown on demo feed cards (pattern from AssessmentHome.tsx). */
function SamplePill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-0.5 normal-case">
      <FlaskConical aria-hidden size={12} />
      {copy.samplePill}
    </span>
  );
}

/** Gentle neighbourhood community feed for older adults — encouragement, not competition. */
export function CommunityTab() {
  const { isDemo, profile, uid, updateProfile } = useUserProfile();
  const [kudos, setKudos] = useState<Record<string, boolean>>({});
  const [segment, setSegment] = useState<FeedSegment>("nearby");
  const [loggingWalk, setLoggingWalk] = useState(false);
  const [justLoggedWalk, setJustLoggedWalk] = useState(false);
  const confirmationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const historySession: HistorySession | null = uid
    ? { kind: "firebase", uid }
    : isDemo
      ? { kind: "demo" }
      : null;
  const { logs, activeDaysThisWeek, logActivity } = useMovementLog(historySession);

  useEffect(() => {
    return () => {
      if (confirmationTimeout.current) clearTimeout(confirmationTimeout.current);
    };
  }, []);

  const goalDays = Math.min(activeDaysThisWeek, WEEKLY_GOAL_DAYS);
  const daysLeft = daysLeftThisWeek();
  const visibleFeed = feedItems.filter((item) => item.segments.includes(segment));
  const optedIn = Boolean(profile?.consents.communityVisibility);
  const thisWeekLogs = logsThisWeek(logs);

  function toggleKudos(id: string) {
    setKudos((current) => ({ ...current, [id]: !current[id] }));
  }

  function handleLogWalk(minutes: number) {
    void logActivity({
      source: "manual_walk",
      activityType: "walk",
      title: "Walk",
      durationMinutes: minutes,
    }).catch(() => {
      // Local copy already recorded by logActivity; a failed remote sync
      // (offline / config) should never surface as an error to the user.
    });
    setLoggingWalk(false);
    setJustLoggedWalk(true);
    if (confirmationTimeout.current) clearTimeout(confirmationTimeout.current);
    confirmationTimeout.current = setTimeout(() => setJustLoggedWalk(false), 4000);
  }

  function handleOptIn() {
    if (!profile) return;
    void updateProfile({
      consents: { ...profile.consents, communityVisibility: true },
    });
  }

  return (
    <>
      <header className="top-bar">
        <h1 className="top-bar__title">{copy.title}</h1>
      </header>
      <div className="app-content app-content--tabs">
        {/* Weekly movement goal — real device-local practice log */}
        <section className="app-card app-card--hero grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[length:var(--text-body)] font-bold">
              {copy.goalTitle(WEEKLY_GOAL_DAYS)}
            </h2>
            <p className="text-[length:var(--text-label)] font-bold text-[var(--muted)]">
              {goalDays >= WEEKLY_GOAL_DAYS ? copy.goalReached : copy.goalDaysLeft(daysLeft)}
            </p>
          </div>
          <p className="text-[length:var(--text-label)] text-[var(--muted)]">
            {copy.goalProgress(goalDays, WEEKLY_GOAL_DAYS)}
          </p>
          <div aria-hidden className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.round((goalDays / WEEKLY_GOAL_DAYS) * 100)}%` }}
            />
          </div>

          {historySession &&
            (loggingWalk ? (
              <div className="grid gap-2">
                <p className="text-[length:var(--text-label)] font-bold">
                  {copy.logWalkPrompt}
                </p>
                <div className="segmented" role="group" aria-label={copy.logWalkPrompt}>
                  {WALK_DURATION_OPTIONS.map((option) => (
                    <button
                      key={option.minutes}
                      onClick={() => handleLogWalk(option.minutes)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <button
                  className="link-action justify-self-start"
                  onClick={() => setLoggingWalk(false)}
                  type="button"
                >
                  {copy.logWalkCancel}
                </button>
              </div>
            ) : (
              <div className="grid gap-1">
                <button
                  className="secondary-action w-full"
                  onClick={() => setLoggingWalk(true)}
                  type="button"
                >
                  {copy.logWalk}
                </button>
                {justLoggedWalk && (
                  <p aria-live="polite" className="text-[length:var(--text-label)] font-bold text-[var(--primary-dark)]">
                    {copy.walkLogged}
                  </p>
                )}
              </div>
            ))}
        </section>

        {isDemo && (
          <>
            <p className="flex items-center gap-2 px-1 text-[length:var(--text-label)] font-bold text-[var(--muted)]">
              {copy.sampleFeedNote}
            </p>

            <div className="segmented" role="group" aria-label="Feed filter">
              {feedSegments.map((item) => (
                <button
                  aria-pressed={segment === item.id}
                  key={item.id}
                  onClick={() => setSegment(item.id)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {visibleFeed.map((item) => (
              <article className="feed-card grid gap-3 border border-[var(--card-border)]" key={item.id}>
                <div className="flex items-center gap-3">
                  <span aria-hidden className="avatar-dot">
                    {item.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-bold">
                      {item.name} {item.activity}
                      <SamplePill />
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
                    {kudos[item.id] ? "Cheered" : "Cheer"}
                  </button>
                  <button className="link-action" type="button">
                    <MessageCircle aria-hidden size={16} />
                    Comment
                  </button>
                </div>
              </article>
            ))}
          </>
        )}

        {!isDemo && !optedIn && (
          <section className="app-card grid gap-3">
            <h2 className="text-[length:var(--text-body)] font-bold">{copy.optInTitle}</h2>
            <p className="text-[length:var(--text-label)] text-[var(--muted)]">{copy.optInBody}</p>
            <button className="primary-action w-full" onClick={handleOptIn} type="button">
              {copy.optInAction}
            </button>
            <button className="secondary-action w-full" type="button">
              {copy.optInDismiss}
            </button>
          </section>
        )}

        {!isDemo && optedIn && (
          <>
            <section className="app-card grid gap-3">
              <h2 className="text-[length:var(--text-body)] font-bold">{copy.yourActivityTitle}</h2>
              {thisWeekLogs.length === 0 ? (
                <p className="text-[length:var(--text-label)] text-[var(--muted)]">
                  {copy.yourActivityEmpty}
                </p>
              ) : (
                <ul className="grid gap-3">
                  {thisWeekLogs.map((log) => (
                    <li className="flex items-center gap-3" key={log.id}>
                      <span aria-hidden className="avatar-dot">
                        <Activity size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{log.title}</p>
                        <p className="text-[length:var(--text-label)] text-[var(--muted)]">
                          {weekdayLabel(log.completedAt)}
                          {log.durationMinutes != null && ` · ${log.durationMinutes} min`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="app-card grid gap-2">
              <h2 className="text-[length:var(--text-body)] font-bold">{copy.emptyFeedTitle}</h2>
              <p className="text-[length:var(--text-label)] text-[var(--muted)]">{copy.emptyFeedBody}</p>
            </section>
          </>
        )}
      </div>
    </>
  );
}
