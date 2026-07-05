"use client";

import { ChevronRight, FlaskConical, TrendingUp } from "lucide-react";
import { useState } from "react";
import type { HistoryEntry } from "@/components/dashboard/demo-display-data";
import { TopBar } from "@/components/layout/TopBar";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const filters = [
  { id: "all", label: "All" },
  { id: "confidence", label: "Confidence" },
  { id: "chairStand", label: "Chair stand" },
  { id: "gait", label: "Gait" },
  { id: "floorRise", label: "Floor rise" },
] as const;

type FilterId = (typeof filters)[number]["id"];

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[length:var(--text-caption)] text-[var(--muted)]">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}

/** Assessment History — a progress journal, secondary screen inside Assessment. */
export function HistoryScreen({
  entries,
  onBack,
  onViewDetail,
}: {
  entries: HistoryEntry[];
  onBack: () => void;
  onViewDetail: (entryId: string) => void;
}) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterId>("all");

  return (
    <>
      <TopBar onBack={onBack} title={t("shell.history.title")} />
      <div className="app-content pb-[calc(20px+env(safe-area-inset-bottom))]">
        {/* Trend summary */}
        <section className="app-card app-card--hero flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--primary-dark)]">
            <TrendingUp aria-hidden size={22} />
          </span>
          <div>
            <p className="font-bold">
              {entries.length} {entries.length === 1 ? "check" : "checks"} recorded
            </p>
            <p className="text-[length:var(--text-label)] text-[var(--muted)]">
              {entries.some((entry) => entry.sample)
                ? t("shell.history.sampleTrend")
                : "Confidence and support levels over time"}
            </p>
          </div>
        </section>

        {/* Filter chips */}
        <div className="-mx-5 overflow-x-auto px-5" role="group" aria-label="Filter history">
          <div className="flex w-max gap-2">
            {filters.map((item) => (
              <button
                aria-pressed={filter === item.id}
                className="filter-chip"
                key={item.id}
                onClick={() => setFilter(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        {entries.length === 0 && (
          <p className="app-card text-[var(--muted)]">{t("shell.history.empty")}</p>
        )}
        {entries.map((entry) => (
          <article className="app-card grid gap-3" key={entry.id}>
            <p className="flex items-center gap-2 text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
              {entry.dateLabel}
              {entry.sample && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-0.5">
                  <FlaskConical aria-hidden size={12} />
                  {t("shell.sample.pill")}
                </span>
              )}
            </p>
            <p className="text-[length:var(--text-body)] font-bold">{entry.overall}</p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[length:var(--text-label)]">
              {(filter === "all" || filter === "confidence") && (
                <Metric label="Confidence" value={`${entry.confidence}/10`} />
              )}
              {(filter === "all" || filter === "chairStand") && (
                <Metric
                  label="Chair stand"
                  value={
                    entry.chairStandSeconds != null
                      ? `${entry.chairStandSeconds} sec`
                      : "Not tested"
                  }
                />
              )}
              {(filter === "all" || filter === "gait") && (
                <Metric label="Gait" value={entry.gaitLabel} />
              )}
              {(filter === "all" || filter === "floorRise") && (
                <Metric label="Floor rise" value={entry.floorRiseLabel} />
              )}
            </dl>
            <button
              className="link-action justify-self-start"
              onClick={() => onViewDetail(entry.id)}
              type="button"
            >
              {t("shell.history.viewDetails")}
              <ChevronRight aria-hidden size={16} />
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
