"use client";

import { CalendarDays, FileText, FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";
import type { HistoryEntry } from "@/components/dashboard/demo-display-data";
import { TopBar } from "@/components/layout/TopBar";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { DECISION_SUPPORT_DISCLAIMER } from "@/config/clinical-config";
import { saveSessionForReport } from "@/lib/report-session";
import type { AssessmentSession } from "@/types/assessment";

/** Read-only detail view for a single history entry. */
export function HistoryDetailScreen({
  entry,
  session,
  onBack,
}: {
  entry: HistoryEntry;
  /** Full session when this entry came from a real saved assessment. */
  session?: AssessmentSession | null;
  onBack: () => void;
}) {
  const router = useRouter();
  const { t } = useLanguage();

  function openReport() {
    if (session) {
      const id = saveSessionForReport(session);
      router.push(`/report/${id}`);
    } else {
      // Sample entries have no stored session — the report route's demo
      // fallback renders with its visible "Demo data" pill.
      router.push("/report/sample");
    }
  }

  return (
    <>
      <TopBar onBack={onBack} title={t("shell.history.detailTitle")} />
      <div className="app-content pb-[calc(20px+env(safe-area-inset-bottom))]">
        <section className="app-card app-card--hero grid gap-2">
          <p className="flex items-center gap-2 text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
            <CalendarDays aria-hidden size={16} />
            {entry.dateLabel}
            {entry.sample && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-0.5">
                <FlaskConical aria-hidden size={12} />
                {t("shell.sample.pill")}
              </span>
            )}
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

        {/* Clinician handoff — physio / OT / doctor opens the printable report */}
        <button className="secondary-action w-full" onClick={openReport} type="button">
          <FileText aria-hidden size={20} />
          {t("shell.result.openReport")}
        </button>

        <p className="text-[length:var(--text-label)] text-[var(--muted)]">
          {DECISION_SUPPORT_DISCLAIMER}
        </p>
      </div>
    </>
  );
}
