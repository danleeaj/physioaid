"use client";

import { ArrowLeft, Flame, Footprints, HandHeart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { ListenButton } from "@/components/i18n/ListenButton";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  communityActivities,
  communityPosts,
  trainerClips,
  weeklySummary,
} from "@/lib/demo/community";
import { PRODUCT_NAME } from "@/config/clinical-config";

function CheerButton({ initialCheers }: { initialCheers: number }) {
  const { t } = useLanguage();
  const [cheered, setCheered] = useState(false);

  return (
    <button
      aria-pressed={cheered}
      className="cheer-button"
      data-cheered={cheered}
      onClick={() => setCheered((current) => !current)}
      type="button"
    >
      <HandHeart aria-hidden size={16} />
      {cheered ? t("community.cheered") : t("community.cheer")} ·{" "}
      {initialCheers + (cheered ? 1 : 0)}
    </button>
  );
}

function JoinPill() {
  const { t } = useLanguage();
  const [joined, setJoined] = useState(false);

  return (
    <button
      aria-pressed={joined}
      className="join-pill"
      data-joined={joined}
      onClick={() => setJoined((current) => !current)}
      type="button"
    >
      {joined ? t("community.joined") : t("community.join")}
    </button>
  );
}

export function CommunityApp() {
  const { t } = useLanguage();
  const activityScore = Math.round(
    (weeklySummary.activeDays / weeklySummary.targetDays) * 100,
  );

  return (
    <main className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-4">
            <Link className="link-action" href="/">
              <ArrowLeft aria-hidden size={18} />
              {PRODUCT_NAME}
            </Link>
          </div>
          <LangSwitch />
        </header>

        <div className="grid gap-3">
          <h1 className="text-[length:var(--text-display)] font-semibold">
            {t("community.title")}
          </h1>
          <p className="max-w-2xl text-[length:var(--text-lead)] text-[var(--muted)]">
            {t("community.support")}
          </p>
          <div>
            <ListenButton
              text={`${t("community.title")}. ${t("community.support")}`}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Feed */}
          <section className="grid content-start gap-4">
            {communityPosts.map((post) => (
              <article className="feed-card grid gap-3 border border-[var(--line)]" key={post.id}>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary-soft)] font-bold text-[var(--primary-dark)]">
                    {post.author.slice(0, 1)}
                  </span>
                  <div>
                    <p className="font-bold">{post.author}</p>
                    <p className="text-[length:var(--text-caption)] text-[var(--muted)]">
                      {post.location} · {post.timeAgo}
                    </p>
                  </div>
                </div>
                <p>{post.body}</p>
                <p className="rounded-[var(--radius-control)] bg-[var(--surface-muted)] px-3 py-2 text-[length:var(--text-label)] font-semibold text-[var(--muted-strong)]">
                  {post.activity}
                </p>
                <div>
                  <CheerButton initialCheers={post.cheers} />
                </div>
              </article>
            ))}
            <p className="text-[length:var(--text-caption)] text-[var(--muted)]">
              {t("community.demoNote")}
            </p>
          </section>

          {/* Sidebar: week, activities, clips */}
          <div className="grid content-start gap-6">
            <section className="panel-card grid gap-4 p-5">
              <h2 className="text-[length:var(--text-lead)] font-semibold">
                {t("community.weekTitle")}
              </h2>
              <div className="flex items-center gap-5">
                <div
                  className="score-ring shrink-0"
                  style={{ "--score": activityScore } as React.CSSProperties}
                >
                  <div>
                    <p className="text-3xl font-bold leading-none">
                      {weeklySummary.activeDays}
                      <span className="text-lg text-[var(--muted)]">
                        /{weeklySummary.targetDays}
                      </span>
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-[var(--muted-strong)]">
                  {t("community.activeDays", {
                    count: weeklySummary.activeDays,
                    total: weeklySummary.targetDays,
                  })}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="stat-tile stat-tile--accent">
                  <Flame aria-hidden className="mx-auto" size={20} />
                  <p className="mt-1 text-xl font-bold">
                    {weeklySummary.chairStandStreakDays}
                  </p>
                  <p className="text-[length:var(--text-caption)]">day streak</p>
                </div>
                <div className="stat-tile">
                  <Footprints aria-hidden className="mx-auto text-[var(--primary)]" size={20} />
                  <p className="mt-1 text-xl font-bold">
                    {weeklySummary.walksThisWeek}
                  </p>
                  <p className="text-[length:var(--text-caption)] text-[var(--muted)]">
                    walks
                  </p>
                </div>
                <div className="stat-tile">
                  <HandHeart aria-hidden className="mx-auto text-[var(--primary)]" size={20} />
                  <p className="mt-1 text-xl font-bold">
                    {weeklySummary.cheersReceived}
                  </p>
                  <p className="text-[length:var(--text-caption)] text-[var(--muted)]">
                    cheers
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-3">
              <h2 className="text-[length:var(--text-lead)] font-semibold">
                {t("community.activitiesTitle")}
              </h2>
              {communityActivities.map((activity) => (
                <div
                  className="quiet-card flex items-center justify-between gap-3 p-4"
                  key={activity.id}
                >
                  <div className="min-w-0">
                    <p className="font-bold">{activity.title}</p>
                    <p className="text-[length:var(--text-label)] text-[var(--muted)]">
                      {activity.venue} · {activity.schedule}
                    </p>
                    <p className="text-[length:var(--text-caption)] font-semibold text-[var(--primary-dark)]">
                      {activity.spots}
                    </p>
                  </div>
                  <JoinPill />
                </div>
              ))}
            </section>

            <section className="grid gap-3">
              <h2 className="text-[length:var(--text-lead)] font-semibold">
                {t("community.clipsTitle")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {trainerClips.map((clip) => (
                  <div className="grid gap-2" key={clip.id}>
                    <div className="clip-cover">
                      <span className="clip-play" />
                    </div>
                    <p className="font-bold leading-snug">{clip.title}</p>
                    <p className="text-[length:var(--text-caption)] text-[var(--muted)]">
                      {clip.coach} · {clip.duration}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <footer className="border-t border-[var(--line)] pt-4">
          <Link
            className="text-[length:var(--text-caption)] text-[var(--muted)] underline underline-offset-4"
            href="/insights"
          >
            {t("landing.plannersLink")}
          </Link>
        </footer>
      </div>
    </main>
  );
}
