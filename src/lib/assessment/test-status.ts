import type {
  AssessmentSession,
  TestId,
  TestRecordStatus,
} from "@/types/assessment";

type TestMetric = {
  completionStatus?: "completed" | "stopped" | "skipped" | "demo";
  source?: string;
};

/**
 * Status of a single stored test metric. Pure — no session context needed.
 *
 * - `undefined` metric → "missing" (never attempted / stripped by the
 *   normalizer).
 * - demo status or demo source → "demo" (sample content, not evidence).
 * - explicit completed/stopped/skipped pass through.
 * - a metric object with data but no completionStatus (older motion records)
 *   counts as "completed".
 */
export function metricRecordStatus(
  metrics: TestMetric | undefined,
): TestRecordStatus {
  if (!metrics) return "missing";
  if (metrics.completionStatus === "demo" || metrics.source === "demo") {
    return "demo";
  }
  if (
    metrics.completionStatus === "completed" ||
    metrics.completionStatus === "stopped" ||
    metrics.completionStatus === "skipped"
  ) {
    return metrics.completionStatus;
  }
  return "completed";
}

/** Stored-record status for any known test on a (normalized) session. */
export function getTestRecordStatus(
  session: AssessmentSession,
  testId: TestId,
): TestRecordStatus {
  switch (testId) {
    case "self_confidence":
      return session.questionnaire ? "completed" : "missing";
    case "sit_to_stand":
      return metricRecordStatus(session.chairStand);
    case "walk":
      return metricRecordStatus(session.motion);
    case "floor_rising":
      return metricRecordStatus(session.floorRising);
    case "timed_up_and_go":
    case "functional_reach":
      // Future tests — no data is ever recorded for them today.
      return "missing";
  }
}

/** Only fully completed records count as clinical evidence (e.g. trends). */
export function isEvidence(status: TestRecordStatus): boolean {
  return status === "completed";
}
