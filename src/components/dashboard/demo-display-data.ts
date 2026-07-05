import type { AssessmentFlow } from "@/components/assessment/useAssessmentFlow";
import type { RiskCategory } from "@/types/assessment";

/**
 * Presentation-layer demo data for the signed-in shell (home dashboard,
 * history journal). This is deliberately static display data — the clinical
 * scoring engine (`analyseAssessment`) is untouched, and any assessment the
 * user actually completes is mapped through `riskLabel`/`toHistoryEntry`
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
  /** Average confidence, 0–10. */
  confidence: number;
  chairStandSeconds: number | null;
  gaitLabel: string;
  floorRiseLabel: string;
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

function gaitLabelFor(flow: AssessmentFlow): string {
  return flow.motionGate.canProceed ? "Stable with caution" : "Needs support";
}

function floorRiseLabelFor(flow: AssessmentFlow): string {
  const status = flow.floorRising.completionStatus;
  if (status === "skipped") return "Skipped for safety";
  if (status === "stopped") return "Stopped for safety";
  return "Completed";
}

/** Map a completed guided assessment (real scoring output) into a history entry. */
export function toHistoryEntry(flow: AssessmentFlow): HistoryEntry {
  const now = new Date();
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `entry-${now.getTime()}`,
    dateISO: now.toISOString(),
    dateLabel: formatDateLabel(now),
    overall: riskLabel(flow.analytics.riskCategory),
    riskCategory: flow.analytics.riskCategory,
    confidence: Number(flow.scoredQuestionnaire.averageScore.toFixed(1)),
    chairStandSeconds: flow.chairStand.durationSeconds ?? null,
    gaitLabel: gaitLabelFor(flow),
    floorRiseLabel: floorRiseLabelFor(flow),
  };
}
