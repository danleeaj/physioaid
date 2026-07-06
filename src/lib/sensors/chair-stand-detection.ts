import { getGuidedChairStandMetrics } from "@/lib/vision/chair-stand";
import type { ChairStandMetrics } from "@/types/assessment";
import type { MotionSample } from "@/types/motion";

// Deviation (m/s^2) from the rolling baseline that counts as a rep-phase
// peak — the push-off/rising burst or the sitting-back-down impact. A
// sit-to-stand transition moves the whole body (and phone) far more
// abruptly than a footstep, so this sits well above the gait step
// detector's threshold. Not yet calibrated against real recordings —
// tune once real test sessions are available.
const REP_PEAK_THRESHOLD = 3;
// Must fall back below this deviation before the next burst can register.
const REP_RESET_THRESHOLD = 1.2;
// Floor between counted peaks, so the tail of one burst isn't mistaken for
// the start of the next.
const MIN_PEAK_INTERVAL_MS = 400;
// Slow-moving average so the baseline tracks the phone's resting position
// in the pocket without absorbing the rep bursts themselves.
const BASELINE_SMOOTHING = 0.02;

function detectMovementPeaks(samples: MotionSample[]): number[] {
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
      deviation > REP_PEAK_THRESHOLD &&
      sample.timestampMs - lastPeakAt > MIN_PEAK_INTERVAL_MS
    ) {
      peakTimestamps.push(sample.timestampMs);
      lastPeakAt = sample.timestampMs;
      armed = false;
    } else if (!armed && deviation < REP_RESET_THRESHOLD) {
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
}): ChairStandMetrics {
  if (input.samples.length === 0 || input.durationSeconds <= 0) {
    return getGuidedChairStandMetrics();
  }

  const peakTimestamps = detectMovementPeaks(input.samples);
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
