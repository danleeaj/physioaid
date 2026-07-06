import { getGuidedChairStandMetrics } from "@/lib/vision/chair-stand";
import type { ChairStandMetrics } from "@/types/assessment";
import type { MotionSample } from "@/types/motion";

const DEFAULT_REP_PEAK_THRESHOLD = 3;
const DEFAULT_REP_RESET_THRESHOLD = 1.2;
const MIN_PEAK_INTERVAL_MS = 400;
const BASELINE_SMOOTHING = 0.02;

export type CalibrationResult = {
  peakThreshold: number;
  resetThreshold: number;
  calibratedPeakCount: number;
};

/**
 * Derives personalized peak/reset thresholds from calibration samples
 * (2–3 practice reps). Finds all deviation peaks above a very low floor,
 * then sets the real threshold at 50% of the median peak — low enough to
 * catch weaker reps, high enough to reject noise.
 */
export function calibrateFromSamples(
  samples: MotionSample[],
): CalibrationResult | null {
  if (samples.length < 20) return null;

  let baseline: number | null = null;
  const peakDeviations: number[] = [];
  let armed = true;
  let lastPeakAt = 0;

  for (const sample of samples) {
    const magnitude = Math.hypot(
      sample.accelerationX,
      sample.accelerationY,
      sample.accelerationZ,
    );
    if (baseline === null) {
      baseline = magnitude;
      continue;
    }
    const deviation = magnitude - baseline;
    baseline += BASELINE_SMOOTHING * (magnitude - baseline);

    if (
      armed &&
      deviation > 0.8 &&
      sample.timestampMs - lastPeakAt > MIN_PEAK_INTERVAL_MS
    ) {
      peakDeviations.push(deviation);
      lastPeakAt = sample.timestampMs;
      armed = false;
    } else if (!armed && deviation < 0.4) {
      armed = true;
    }
  }

  if (peakDeviations.length < 2) return null;

  const sorted = [...peakDeviations].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  return {
    peakThreshold: Math.max(1.0, median * 0.5),
    resetThreshold: Math.max(0.3, median * 0.2),
    calibratedPeakCount: peakDeviations.length,
  };
}

function detectMovementPeaks(
  samples: MotionSample[],
  peakThreshold = DEFAULT_REP_PEAK_THRESHOLD,
  resetThreshold = DEFAULT_REP_RESET_THRESHOLD,
): number[] {
  let baseline: number | null = null;
  let armed = true;
  let lastPeakAt = 0;
  const peakTimestamps: number[] = [];

  for (const sample of samples) {
    const magnitude = Math.hypot(
      sample.accelerationX,
      sample.accelerationY,
      sample.accelerationZ,
    );

    if (baseline === null) {
      baseline = magnitude;
      continue;
    }

    const deviation = magnitude - baseline;
    baseline += BASELINE_SMOOTHING * (magnitude - baseline);

    if (
      armed &&
      deviation > peakThreshold &&
      sample.timestampMs - lastPeakAt > MIN_PEAK_INTERVAL_MS
    ) {
      peakTimestamps.push(sample.timestampMs);
      lastPeakAt = sample.timestampMs;
      armed = false;
    } else if (!armed && deviation < resetThreshold) {
      armed = true;
    }
  }

  return peakTimestamps;
}

/**
 * Classifies rep-to-rep rhythm from the interval between successive rep
 * cycles, using the coefficient of variation (stdDev / mean) — scale-
 * independent, so it works the same whether reps take 1s or 3s each.
 */
function classifyRhythm(
  repCycleTimestamps: number[],
): "steady" | "variable" | "unsafe" {
  if (repCycleTimestamps.length < 3) {
    return "variable";
  }

  const intervals: number[] = [];
  for (let i = 1; i < repCycleTimestamps.length; i++) {
    intervals.push(repCycleTimestamps[i] - repCycleTimestamps[i - 1]);
  }

  const mean = intervals.reduce((total, value) => total + value, 0) / intervals.length;
  const variance =
    intervals.reduce((total, value) => total + (value - mean) ** 2, 0) /
    intervals.length;
  const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 1;

  if (coefficientOfVariation < 0.25) return "steady";
  if (coefficientOfVariation < 0.6) return "variable";
  return "unsafe";
}

/**
 * Counts sit-to-stand repetitions from raw accelerometer samples via peak
 * detection: each full rep (push off the chair, then sit back down) shows
 * up as two acceleration bursts, so repetitions = floor(peaks / 2). Falls
 * back to the fixed placeholder if no samples were captured (motion
 * unsupported/denied on this device/browser).
 */
export function summarizeChairStandSamples(input: {
  samples: MotionSample[];
  durationSeconds: number;
  calibration?: CalibrationResult | null;
}): ChairStandMetrics {
  if (input.samples.length === 0 || input.durationSeconds <= 0) {
    return getGuidedChairStandMetrics();
  }

  const peakTimestamps = detectMovementPeaks(
    input.samples,
    input.calibration?.peakThreshold,
    input.calibration?.resetThreshold,
  );
  const repetitions = Math.floor(peakTimestamps.length / 2);
  // One timestamp per full rep cycle (every other peak: rise, then sit).
  const repCycleTimestamps = peakTimestamps.filter((_, index) => index % 2 === 0);

  return {
    completionStatus: "completed",
    durationSeconds: Math.round(input.durationSeconds),
    repetitions,
    movementQuality:
      repetitions > 0 ? classifyRhythm(repCycleTimestamps) : undefined,
    source: "accelerometer",
  };
}
