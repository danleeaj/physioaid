"use client";

import { CalendarDays } from "lucide-react";
import type { HistoryEntry } from "@/components/dashboard/demo-display-data";
import { shellCopy } from "@/components/layout/copy";
import { TopBar } from "@/components/layout/TopBar";
import { DECISION_SUPPORT_DISCLAIMER } from "@/config/clinical-config";

/** Read-only detail view for a single history entry. */
export function HistoryDetailScreen({
  entry,
  onBack,
}: {
  entry: HistoryEntry;
  onBack: () => void;
}) {
  return (
    <>
      <TopBar onBack={onBack} title={shellCopy.history.detailTitle} />
      <div className="app-content pb-[calc(20px+env(safe-area-inset-bottom))]">
        <section className="app-card app-card--hero grid gap-2">
          <p className="flex items-center gap-2 text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
            <CalendarDays aria-hidden size={16} />
            {entry.dateLabel}
          </p>
          <p className="text-[length:var(--text-title)] font-bold">{entry.overall}</p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="stat-tile">
            <p className="text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
              Confidence
            </p>
            <p className="mt-1 text-xl font-bold leading-tight">{entry.confidence}/10</p>
          </div>
          <div className="stat-tile">
            <p className="text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
              Chair stand
            </p>
            <p className="mt-1 text-xl font-bold leading-tight">
              {entry.chairStandSeconds != null ? `${entry.chairStandSeconds} sec` : "Not tested"}
            </p>
          </div>
          <div className="stat-tile">
            <p className="text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
              Gait
            </p>
            <p className="mt-1 text-xl font-bold leading-tight">{entry.gaitLabel}</p>
          </div>
          <div className="stat-tile">
            <p className="text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
              Floor rise
            </p>
            <p className="mt-1 text-xl font-bold leading-tight">{entry.floorRiseLabel}</p>
          </div>
        </section>

        <p className="text-[length:var(--text-label)] text-[var(--muted)]">
          {DECISION_SUPPORT_DISCLAIMER}
        </p>
      </div>
    </>
  );
}
