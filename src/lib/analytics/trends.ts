import { analyseSessionIfPossible } from "@/lib/analytics/partial";
import { isDemoSessionId } from "@/lib/assessment/normalize-session";
import { metricRecordStatus } from "@/lib/assessment/test-status";
import type { AssessmentSession, RiskCategory } from "@/types/assessment";

/**
 * Pure trend engine for the dashboard (Goal 8). Compares the two most recent
 * qualifying sessions per metric — evidence only (completed records), never
 * demo/stopped data — and produces plain-language, decision-support output.
 * All copy here is deliberately non-diagnostic: results "improved", stayed
 * "steady", or "changed"; anything notable is framed as worth sharing with a
 * physiotherapist, never as a medical finding.
 *
 * Input sessions are assumed already normalized (`normalizeSession`) — every
 * read path in the app normalizes before handing sessions out.
 */

export type TrendMetricId =
  | "overall"
  | "confidence"
  | "sit_to_stand"
  | "gait_speed"
  | "floor_rising"
  | "timed_up_and_go"
  | "functional_reach";

export type TrendDirection = "improved" | "steady" | "declined";

export type TrendUnit = "score" | "seconds" | "m/s" | "band";

export type MetricTrend = {
  metric: TrendMetricId;
  direction: TrendDirection;
  /** Most recent value ("band" metrics store the numeric risk band 0/1/2). */
  latest: number;
  previous: number;
  /** latest - previous (sign is metric-relative; see per-metric rules). */
  delta: number;
  unit: TrendUnit;
  latestDate: string;
  previousDate: string;
  caveats: string[];
};

export type TrendMissing = { metric: TrendMetricId; reason: string };

export type TrendReport = {
  sessionsConsidered: number;
  trends: MetricTrend[];
  missing: TrendMissing[];
  globalCaveats: string[];
};

/** Confidence (0–10 average score): |Δ| under this band counts as steady. */
export const CONFIDENCE_STEADY_BAND = 0.5;
/** Sit to stand: steady when |Δ| ≤ 2s or < 10% of the previous time, whichever is larger. */
export const SIT_TO_STAND_STEADY_SECONDS = 2;
export const SIT_TO_STAND_STEADY_FRACTION = 0.1;
/** Gait speed (m/s): |Δ| under this band counts as steady. */
export const GAIT_SPEED_STEADY_BAND = 0.05;
/** Floor rising reuses the sit-to-stand timing tolerance. */
export const FLOOR_RISING_STEADY_SECONDS = 2;
export const FLOOR_RISING_STEADY_FRACTION = 0.1;
/** Hard cap on the deterministic summary length. */
export const TREND_SUMMARY_MAX_CHARS = 400;

/** Numeric band used for the "overall" trend (lower is better). */
export function riskBandValue(risk: RiskCategory): number {
  return risk === "low" ? 0 : risk === "moderate" ? 1 : 2;
}

/** Participant-facing word for a numeric risk band. */
export function trendBandLabel(band: number): string {
  return band <= 0 ? "low" : band === 1 ? "moderate" : "higher";
}

function trimNumber(value: number, decimals: number): string {
  return String(Number(value.toFixed(decimals)));
}

/** Display formatting shared by the trend cards and the computed summary. */
export function formatTrendValue(unit: TrendUnit, value: number): string {
  switch (unit) {
    case "seconds":
      return `${trimNumber(value, 1)}s`;
    case "m/s":
      return `${trimNumber(value, 2)} m/s`;
    case "band":
      return `${trendBandLabel(value)} support`;
    case "score":
      return `${trimNumber(value, 1)}/10`;
  }
}

type Sample = { value: number; session: AssessmentSession };

/** The two most recent sessions (input already sorted desc) with a usable value. */
function latestTwo(
  sessions: AssessmentSession[],
  extract: (session: AssessmentSession) => number | null,
): [Sample, Sample] | null {
  const found: Sample[] = [];
  for (const session of sessions) {
    const value = extract(session);
    if (value !== null) {
      found.push({ value, session });
      if (found.length === 2) return [found[0], found[1]];
    }
  }
  return null;
}

function buildTrend(
  metric: TrendMetricId,
  unit: TrendUnit,
  pair: [Sample, Sample],
  direction: TrendDirection,
  caveats: string[] = [],
): MetricTrend {
  const [latest, previous] = pair;
  return {
    metric,
    direction,
    latest: latest.value,
    previous: previous.value,
    delta: latest.value - previous.value,
    unit,
    latestDate: latest.session.createdAt,
    previousDate: previous.session.createdAt,
    caveats,
  };
}

/** Direction for timing metrics (lower = improved, shared tolerance rule). */
function timingDirection(
  latest: number,
  previous: number,
  steadySeconds: number,
  steadyFraction: number,
): TrendDirection {
  const delta = latest - previous;
  const steadyBand = Math.max(steadySeconds, steadyFraction * previous);
  if (Math.abs(delta) <= steadyBand) return "steady";
  return delta < 0 ? "improved" : "declined";
}

function overallValue(session: AssessmentSession): number | null {
  const risk =
    session.analytics?.riskCategory ??
    analyseSessionIfPossible(session)?.riskCategory;
  return risk ? riskBandValue(risk) : null;
}

function confidenceValue(session: AssessmentSession): number | null {
  const score = session.questionnaire?.averageScore;
  return typeof score === "number" && Number.isFinite(score) ? score : null;
}

function sitToStandValue(session: AssessmentSession): number | null {
  const record = session.chairStand;
  // Evidence only — completed records, never demo/stopped/skipped.
  if (!record || metricRecordStatus(record) !== "completed") return null;
  return Number.isFinite(record.durationSeconds)
    ? record.durationSeconds
    : null;
}

function gaitSpeedValue(session: AssessmentSession): number | null {
  const record = session.motion;
  if (!record || metricRecordStatus(record) !== "completed") return null;
  const speed = record.gaitSpeedMetersPerSecond;
  return typeof speed === "number" && Number.isFinite(speed) ? speed : null;
}

function floorRisingValue(session: AssessmentSession): number | null {
  const record = session.floorRising;
  if (!record || metricRecordStatus(record) !== "completed") return null;
  const seconds = record.durationSeconds;
  return typeof seconds === "number" && Number.isFinite(seconds)
    ? seconds
    : null;
}

/** Plain-language reason a metric could not be compared, based on the latest check. */
function missingReason(
  metric: TrendMetricId,
  latest: AssessmentSession,
): string {
  switch (metric) {
    case "confidence":
      return latest.questionnaire
        ? "The confidence questions were answered in only one recent check."
        : "The confidence questions weren't answered in your latest check.";
    case "sit_to_stand": {
      const status = metricRecordStatus(latest.chairStand);
      if (status === "skipped")
        return "Sit to stand was skipped in your latest check.";
      if (status === "stopped")
        return "Sit to stand was stopped early in your latest check, so times aren't compared.";
      if (status === "completed")
        return "Sit to stand was completed in only one recent check.";
      return "Sit to stand wasn't done in your latest check.";
    }
    case "gait_speed": {
      const status = metricRecordStatus(latest.motion);
      if (status === "completed")
        return "Walking speed was measured in only one recent check.";
      if (status === "skipped")
        return "The walk test was skipped in your latest check.";
      if (status === "stopped")
        return "The walk test was stopped early in your latest check.";
      return "Walking speed wasn't measured in your latest check.";
    }
    case "floor_rising": {
      const status = metricRecordStatus(latest.floorRising);
      if (status === "skipped")
        return "Floor rising was skipped in your latest check.";
      if (status === "stopped")
        return "Floor rising was stopped early in your latest check.";
      if (status === "completed")
        return "Floor rising was completed in only one recent check.";
      return "Floor rising wasn't done in your latest check.";
    }
    case "overall":
      return "An overall comparison needs the confidence questions and sit-to-stand in two checks.";
    case "timed_up_and_go":
    case "functional_reach":
      // Future tests — never recorded today, never reported as missing.
      return "";
  }
}

/**
 * Compare the two most recent qualifying (non-demo, normalized) sessions per
 * metric. Returns null when fewer than two sessions exist or no metric is
 * comparable — callers render an empty state and skip the AI summary.
 */
export function computeTrends(
  sessions: AssessmentSession[],
): TrendReport | null {
  const usable = sessions
    .filter((session) => !isDemoSessionId(session.id))
    .slice()
    .sort((a, b) => {
      const aTime = Date.parse(a.createdAt);
      const bTime = Date.parse(b.createdAt);
      return (
        (Number.isFinite(bTime) ? bTime : 0) -
        (Number.isFinite(aTime) ? aTime : 0)
      );
    });
  if (usable.length < 2) return null;

  const latestSession = usable[0];
  const trends: MetricTrend[] = [];
  const missing: TrendMissing[] = [];

  const note = (metric: TrendMetricId) => {
    const reason = missingReason(metric, latestSession);
    if (reason) missing.push({ metric, reason });
  };

  // Overall risk band — lower is better; any band change is a real change.
  const overallPair = latestTwo(usable, overallValue);
  if (overallPair) {
    const delta = overallPair[0].value - overallPair[1].value;
    trends.push(
      buildTrend(
        "overall",
        "band",
        overallPair,
        delta === 0 ? "steady" : delta < 0 ? "improved" : "declined",
      ),
    );
  } else {
    note("overall");
  }

  // Confidence (0–10 average) — higher is better.
  const confidencePair = latestTwo(usable, confidenceValue);
  if (confidencePair) {
    const delta = confidencePair[0].value - confidencePair[1].value;
    trends.push(
      buildTrend(
        "confidence",
        "score",
        confidencePair,
        Math.abs(delta) < CONFIDENCE_STEADY_BAND
          ? "steady"
          : delta > 0
            ? "improved"
            : "declined",
      ),
    );
  } else {
    note("confidence");
  }

  // Sit to stand (seconds) — lower is better; tolerance 2s or 10%.
  const sitToStandPair = latestTwo(usable, sitToStandValue);
  if (sitToStandPair) {
    const caveats: string[] = [];
    const latestReps = sitToStandPair[0].session.chairStand?.repetitions;
    const previousReps = sitToStandPair[1].session.chairStand?.repetitions;
    if (
      typeof latestReps === "number" &&
      typeof previousReps === "number" &&
      latestReps !== previousReps
    ) {
      caveats.push(
        `The two checks used different repetition counts (${previousReps} vs ${latestReps}), so times aren't directly comparable.`,
      );
    }
    trends.push(
      buildTrend(
        "sit_to_stand",
        "seconds",
        sitToStandPair,
        timingDirection(
          sitToStandPair[0].value,
          sitToStandPair[1].value,
          SIT_TO_STAND_STEADY_SECONDS,
          SIT_TO_STAND_STEADY_FRACTION,
        ),
        caveats,
      ),
    );
  } else {
    note("sit_to_stand");
  }

  // Gait speed (m/s) — higher is better.
  const gaitPair = latestTwo(usable, gaitSpeedValue);
  if (gaitPair) {
    const delta = gaitPair[0].value - gaitPair[1].value;
    trends.push(
      buildTrend(
        "gait_speed",
        "m/s",
        gaitPair,
        Math.abs(delta) < GAIT_SPEED_STEADY_BAND
          ? "steady"
          : delta > 0
            ? "improved"
            : "declined",
      ),
    );
  } else {
    note("gait_speed");
  }

  // Floor rising (seconds) — lower is better; only when both checks completed
  // it with a recorded time, otherwise it contributes a missing note.
  const floorPair = latestTwo(usable, floorRisingValue);
  if (floorPair) {
    trends.push(
      buildTrend(
        "floor_rising",
        "seconds",
        floorPair,
        timingDirection(
          floorPair[0].value,
          floorPair[1].value,
          FLOOR_RISING_STEADY_SECONDS,
          FLOOR_RISING_STEADY_FRACTION,
        ),
      ),
    );
  } else {
    note("floor_rising");
  }

  // Timed up and go / functional reach have no recorded data today — no
  // trend cards, no missing noise.

  if (trends.length === 0) return null;

  return {
    sessionsConsidered: usable.length,
    trends,
    missing,
    globalCaveats: [
      "Trends compare your two most recent checks only.",
      "Small changes can be normal day-to-day variation.",
    ],
  };
}

function trendSentence(trend: MetricTrend): string {
  const previous = formatTrendValue(trend.unit, trend.previous);
  const latest = formatTrendValue(trend.unit, trend.latest);
  switch (trend.metric) {
    case "overall":
      return trend.direction === "steady"
        ? "Your overall support level is steady."
        : `Your overall support level went from ${previous} to ${latest}.`;
    case "confidence":
      return trend.direction === "steady"
        ? "Your confidence score is steady."
        : trend.direction === "improved"
          ? `Your confidence score rose from ${previous} to ${latest}.`
          : `Your confidence score changed from ${previous} to ${latest}.`;
    case "sit_to_stand":
      return trend.direction === "steady"
        ? "Your sit-to-stand time is steady."
        : trend.direction === "improved"
          ? `Your sit-to-stand time improved from ${previous} to ${latest}.`
          : `Your sit-to-stand time changed from ${previous} to ${latest}.`;
    case "gait_speed":
      return trend.direction === "steady"
        ? "Your walking speed is steady."
        : trend.direction === "improved"
          ? `Your walking speed improved from ${previous} to ${latest}.`
          : `Your walking speed changed from ${previous} to ${latest}.`;
    case "floor_rising":
      return trend.direction === "steady"
        ? "Your floor-rising time is steady."
        : trend.direction === "improved"
          ? `Your floor-rising time improved from ${previous} to ${latest}.`
          : `Your floor-rising time changed from ${previous} to ${latest}.`;
    case "timed_up_and_go":
    case "functional_reach":
      return "";
  }
}

/**
 * Deterministic plain-language summary (≤ 400 chars, never diagnostic).
 * Serves as the on-device summary when AI consent is off and as the
 * client + server fallback when the AI route can't answer.
 */
export function buildComputedTrendSummary(report: TrendReport): string {
  const closing =
    "Worth sharing with your physiotherapist at your next visit.";
  let summary = "";
  for (const trend of report.trends) {
    const sentence = trendSentence(trend);
    if (!sentence) continue;
    const candidate = summary ? `${summary} ${sentence}` : sentence;
    if (`${candidate} ${closing}`.length > TREND_SUMMARY_MAX_CHARS) break;
    summary = candidate;
  }
  return (summary ? `${summary} ${closing}` : closing).slice(
    0,
    TREND_SUMMARY_MAX_CHARS,
  );
}
