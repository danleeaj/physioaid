import { getMotionGate } from "@/lib/functional-tests/gates";
import type { AssessmentSession, RiskCategory } from "@/types/assessment";

/**
 * Presentation-layer demo data for the signed-in shell (home dashboard,
 * history journal). This is deliberately static display data — the clinical
 * scoring engine (`analyseAssessment`) is untouched, and any assessment the
 * user actually completes is mapped through `riskLabel`/`sessionToHistoryEntry`
 * below so real results and demo cards share one vocabulary.
 */

export type HistoryEntry = {
  id: string;
  /** ISO date used for ordering. */
  dateISO: string;
  /** Display label, e.g. "12 Jan 2026". */
  dateLabel: string;
  /** Overall status in participant language. */
  overall: string;
  riskCategory: RiskCategory | null;
  /** Average confidence, 0–10 — null when the questionnaire was not done. */
  confidence: number | null;
  chairStandSeconds: number | null;
  gaitLabel: string;
  floorRiseLabel: string;
  /** True for static Mr Tan sample entries (demo mode only). */
  sample?: boolean;
};

/** Participant-facing overall-status vocabulary for the scoring engine's risk category. */
export function riskLabel(riskCategory: RiskCategory): string {
  if (riskCategory === "high") return "Higher support needed";
  if (riskCategory === "moderate") return "Moderate support needed";
  return "On track";
}

export const demoHistory: HistoryEntry[] = [
  {
    id: "demo-2026-01-12",
    dateISO: "2026-01-12",
    dateLabel: "12 Jan 2026",
    overall: "Moderate support needed",
    riskCategory: "moderate",
    confidence: 7,
    chairStandSeconds: 12,
    gaitLabel: "Needs support",
    floorRiseLabel: "Skipped for safety",
    sample: true,
  },
  {
    id: "demo-2026-01-05",
    dateISO: "2026-01-05",
    dateLabel: "5 Jan 2026",
    overall: "Higher support needed",
    riskCategory: "high",
    confidence: 5,
    chairStandSeconds: 15,
    gaitLabel: "Needs support",
    floorRiseLabel: "Skipped for safety",
    sample: true,
  },
  {
    id: "demo-2025-12-28",
    dateISO: "2025-12-28",
    dateLabel: "28 Dec 2025",
    overall: "Baseline check",
    riskCategory: null,
    confidence: 6,
    chairStandSeconds: 14,
    gaitLabel: "Stable with caution",
    floorRiseLabel: "Not tested",
    sample: true,
  },
];

/** Demo person shown on the shell chrome (display only — the guided flow keeps its own demographics state). */
export const demoPerson = {
  name: "Mr Tan",
  ageGroup: "70s",
  location: "Toa Payoh",
  carePartner: "Not connected",
  preferredLanguage: "English",
  recommendedNextStep: "8-minute balance practice",
};

const monthLabels = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDateLabel(date: Date): string {
  return `${date.getDate()} ${monthLabels[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Map a completed assessment session (real scoring output) into a history
 * entry. Reuses the existing motion gate so "Needs support" matches the
 * engine's own thresholds.
 */
export function sessionToHistoryEntry(session: AssessmentSession): HistoryEntry {
  const created = new Date(session.createdAt);
  const gaitOk = session.motion ? getMotionGate(session.motion).canProceed : false;
  const floorStatus = session.floorRising?.completionStatus;
  return {
    id: session.id,
    dateISO: session.createdAt,
    dateLabel: formatDateLabel(created),
    overall: session.analytics
      ? riskLabel(session.analytics.riskCategory)
      : "Check recorded",
    riskCategory: session.analytics?.riskCategory ?? null,
    confidence: session.questionnaire
      ? Number(session.questionnaire.averageScore.toFixed(1))
      : null,
    chairStandSeconds: session.chairStand?.durationSeconds ?? null,
    gaitLabel: gaitOk ? "Stable with caution" : "Needs support",
    floorRiseLabel:
      floorStatus === "skipped"
        ? "Skipped for safety"
        : floorStatus === "stopped"
          ? "Stopped for safety"
          : floorStatus
            ? "Completed"
            : "Not tested",
  };
}
