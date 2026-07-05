"use client";

import {
  Activity,
  ArrowRight,
  ChevronRight,
  FlaskConical,
  Footprints,
  UserRound,
} from "lucide-react";
import type { HistoryEntry } from "@/components/dashboard/demo-display-data";
import { useLanguage } from "@/components/i18n/LanguageProvider";

function SamplePill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-0.5 normal-case">
      <FlaskConical aria-hidden size={12} />
      {label}
    </span>
  );
}

/** Assessment tab home — compact health dashboard, not a marketing page. */
export function AssessmentHome({
  entries,
  profileName,
  onStartAssessment,
  onOpenExercise,
  onViewHistory,
  onViewHistoryDetail,
  onOpenProfile,
}: {
  entries: HistoryEntry[];
  /** The signed-in user's preferred name (demo: Mr Tan). */
  profileName: string | null;
  onStartAssessment: () => void;
  onOpenExercise: () => void;
  onViewHistory: () => void;
  onViewHistoryDetail: (entryId: string) => void;
  onOpenProfile: () => void;
}) {
  const { t } = useLanguage();
  const lastResult = entries[0];
  const preview = entries.slice(0, 3);

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("shell.home.greetingMorning")
      : hour < 18
        ? t("shell.home.greetingAfternoon")
        : t("shell.home.greetingEvening");

  return (
    <>
      <header className="top-bar justify-between">
        <h1 className="top-bar__title">
          {profileName ? `${greeting}, ${profileName}` : greeting}
        </h1>
        <button
          aria-label={t("shell.home.profileButton")}
          className="icon-button -mr-2"
          onClick={onOpenProfile}
          type="button"
        >
          <UserRound aria-hidden size={24} />
        </button>
      </header>

      <div className="app-content app-content--tabs">
        {/* Today card */}
        <section className="app-card app-card--hero grid gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--primary-dark)]">
              <Activity aria-hidden size={22} />
            </span>
            <div>
              <h2 className="text-[length:var(--text-lead)] font-bold">
                {t("shell.home.todayTitle")}
              </h2>
              <p className="text-[length:var(--text-label)] text-[var(--muted)]">
                {t("shell.home.todayDuration")}
              </p>
            </div>
          </div>
          <p className="text-[length:var(--text-label)] text-[var(--muted)]">
            {t("shell.home.reassurance")}
          </p>
          <button className="primary-action w-full" onClick={onStartAssessment} type="button">
            {t("shell.home.startAssessment")}
            <ArrowRight aria-hidden size={20} />
          </button>
        </section>

        {/* Last result card */}
        {lastResult && (
          <section className="app-card grid gap-2">
            <p className="flex items-center gap-2 text-[length:var(--text-caption)] font-bold uppercase tracking-wide text-[var(--muted)]">
              {t("shell.home.lastResultTitle")} · {lastResult.dateLabel}
              {lastResult.sample && <SamplePill label={t("shell.sample.pill")} />}
            </p>
            <p className="text-[length:var(--text-lead)] font-bold">
              {lastResult.overall}
            </p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[length:var(--text-label)]">
              <div>
                <dt className="text-[var(--muted)]">{t("shell.home.confidenceLabel")}</dt>
                <dd className="font-bold">{lastResult.confidence}/10</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">{t("shell.home.chairStandLabel")}</dt>
                <dd className="font-bold">
                  {lastResult.chairStandSeconds != null
                    ? `${lastResult.chairStandSeconds} sec`
                    : t("shell.home.notTested")}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[var(--muted)]">{t("shell.home.walkingLabel")}</dt>
                <dd className="font-bold">{lastResult.gaitLabel}</dd>
              </div>
            </dl>
          </section>
        )}

        {/* Recommended next step — sample content until a real backend exists */}
        <section className="app-card grid gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-warm-soft)] text-[var(--accent-warm)]">
              <Footprints aria-hidden size={22} />
            </span>
            <div>
              <p className="flex items-center gap-2 text-[length:var(--text-caption)] font-bold uppercase tracking-wide text-[var(--muted)]">
                {t("shell.home.nextStepTitle")}
                <SamplePill label={t("shell.sample.pill")} />
              </p>
              <p className="text-[length:var(--text-body)] font-bold">
                {t("shell.home.nextStepBody")}
              </p>
            </div>
          </div>
          <button className="secondary-action w-full" onClick={onOpenExercise} type="button">
            {t("shell.home.openExercise")}
            <ArrowRight aria-hidden size={20} />
          </button>
        </section>

        {/* History preview */}
        <section className="grid grid-cols-1 gap-2">
          <h2 className="px-1 text-[length:var(--text-body)] font-bold">
            {t("shell.home.historyTitle")}
          </h2>
          {preview.length === 0 && (
            <p className="app-card text-[length:var(--text-label)] text-[var(--muted)]">
              {t("shell.home.historyEmpty")}
            </p>
          )}
          {preview.map((entry) => (
            <button
              className="row-button"
              key={entry.id}
              onClick={() => onViewHistoryDetail(entry.id)}
              type="button"
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
                  {entry.dateLabel}
                  {entry.sample && <SamplePill label={t("shell.sample.pill")} />}
                </p>
                <p className="truncate font-bold">{entry.overall}</p>
                <p className="text-[length:var(--text-label)] text-[var(--muted)]">
                  {t("shell.home.confidenceLabel")} {entry.confidence}/10
                </p>
              </div>
              <ChevronRight aria-hidden className="shrink-0 text-[var(--muted)]" size={20} />
            </button>
          ))}
          <button className="link-action justify-self-start" onClick={onViewHistory} type="button">
            {t("shell.home.viewAllHistory")}
            <ArrowRight aria-hidden size={16} />
          </button>
        </section>
      </div>
    </>
  );
}
