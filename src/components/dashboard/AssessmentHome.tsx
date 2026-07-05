"use client";

import {
  Activity,
  ArrowRight,
  ChevronRight,
  FlaskConical,
  Footprints,
  UserRound,
} from "lucide-react";
import { shellCopy } from "@/components/layout/copy";
import {
  demoPerson,
  type HistoryEntry,
} from "@/components/dashboard/demo-display-data";

const copy = shellCopy.home;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Assessment tab home — compact health dashboard, not a marketing page. */
export function AssessmentHome({
  entries,
  onStartAssessment,
  onOpenExercise,
  onViewHistory,
  onViewHistoryDetail,
  onOpenProfile,
}: {
  entries: HistoryEntry[];
  onStartAssessment: () => void;
  onOpenExercise: () => void;
  onViewHistory: () => void;
  onViewHistoryDetail: (entryId: string) => void;
  onOpenProfile: () => void;
}) {
  const lastResult = entries[0];
  const preview = entries.slice(0, 3);

  return (
    <>
      <header className="top-bar justify-between">
        <h1 className="top-bar__title">
          {greeting()}, {demoPerson.name}
        </h1>
        <button
          aria-label="Open profile and settings"
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
                {copy.todayTitle}
              </h2>
              <p className="text-[length:var(--text-label)] text-[var(--muted)]">
                {copy.todayDuration}
              </p>
            </div>
          </div>
          <p className="text-[length:var(--text-label)] text-[var(--muted)]">
            {copy.reassurance}
          </p>
          <button className="primary-action w-full" onClick={onStartAssessment} type="button">
            {copy.startAssessment}
            <ArrowRight aria-hidden size={20} />
          </button>
        </section>

        {/* Last result card */}
        {lastResult && (
          <section className="app-card grid gap-2">
            <p className="flex items-center gap-2 text-[length:var(--text-caption)] font-bold uppercase tracking-wide text-[var(--muted)]">
              {copy.lastResultTitle} · {lastResult.dateLabel}
              {lastResult.sample && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-0.5 normal-case">
                  <FlaskConical aria-hidden size={12} />
                  Sample
                </span>
              )}
            </p>
            <p className="text-[length:var(--text-lead)] font-bold">
              {lastResult.overall}
            </p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[length:var(--text-label)]">
              <div>
                <dt className="text-[var(--muted)]">Confidence</dt>
                <dd className="font-bold">{lastResult.confidence}/10</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Chair stand</dt>
                <dd className="font-bold">
                  {lastResult.chairStandSeconds != null
                    ? `${lastResult.chairStandSeconds} sec`
                    : "Not tested"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[var(--muted)]">Walking</dt>
                <dd className="font-bold">{lastResult.gaitLabel}</dd>
              </div>
            </dl>
          </section>
        )}

        {/* Recommended next step */}
        <section className="app-card grid gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-warm-soft)] text-[var(--accent-warm)]">
              <Footprints aria-hidden size={22} />
            </span>
            <div>
              <p className="text-[length:var(--text-caption)] font-bold uppercase tracking-wide text-[var(--muted)]">
                {copy.nextStepTitle}
              </p>
              <p className="text-[length:var(--text-body)] font-bold">
                {copy.nextStepBody}
              </p>
            </div>
          </div>
          <button className="secondary-action w-full" onClick={onOpenExercise} type="button">
            {copy.openExercise}
            <ArrowRight aria-hidden size={20} />
          </button>
        </section>

        {/* History preview */}
        <section className="grid grid-cols-1 gap-2">
          <h2 className="px-1 text-[length:var(--text-body)] font-bold">
            {copy.historyTitle}
          </h2>
          {preview.length === 0 && (
            <p className="app-card text-[length:var(--text-label)] text-[var(--muted)]">
              No saved checks yet. Your first mobility check will appear here.
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
                  {entry.sample && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-0.5">
                      <FlaskConical aria-hidden size={12} />
                      Sample
                    </span>
                  )}
                </p>
                <p className="truncate font-bold">{entry.overall}</p>
                <p className="text-[length:var(--text-label)] text-[var(--muted)]">
                  Confidence {entry.confidence}/10
                </p>
              </div>
              <ChevronRight aria-hidden className="shrink-0 text-[var(--muted)]" size={20} />
            </button>
          ))}
          <button className="link-action justify-self-start" onClick={onViewHistory} type="button">
            {copy.viewAllHistory}
            <ArrowRight aria-hidden size={16} />
          </button>
        </section>
      </div>
    </>
  );
}
