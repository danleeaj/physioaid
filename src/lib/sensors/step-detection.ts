import type { MotionSample } from "@/types/motion";

/**
 * Average step-length-to-height ratio, blended across the commonly cited
 * biomechanics constants (~0.415 for men, ~0.413 for women). We don't collect
 * sex, so a single blended constant keeps the estimate reasonable without
 * asking for another data point.
 */
const STEP_LENGTH_HEIGHT_RATIO = 0.414;

/** Reasonable population-average height fallback (metres) when none is entered. */
export const DEFAULT_HEIGHT_METERS = 1.65;

export function estimateStepLengthMeters(heightMeters: number): number {
  return heightMeters * STEP_LENGTH_HEIGHT_RATIO;
}

export type StepProgress = {
  stepCount: number;
  distanceMeters: number;
};

type StepCounterOptions = {
  stepLengthMeters: number;
  onStep: (progress: StepProgress) => void;
};

// Deviation (m/s^2) from the rolling baseline that counts as a step's peak.
const STEP_PEAK_THRESHOLD = 1.5;
// Must fall back below this deviation before the next peak can register —
// hysteresis stops a single step's oscillation from being counted twice.
const STEP_RESET_THRESHOLD = 0.6;
// Caps cadence at 4 steps/sec, well above normal walking pace, as a guard
// against double-counting sensor noise as a step.
const MIN_STEP_INTERVAL_MS = 250;
// Slow-moving average so the baseline tracks orientation/gravity drift
// (e.g. the phone settling in a pocket) without absorbing the step peaks
// themselves.
const BASELINE_SMOOTHING = 0.02;

/**
 * Real-time step counter via peak detection on accelerometer magnitude.
 * No GPS, no ML — a rolling baseline plus a hysteresis threshold, the same
 * category of algorithm used in consumer pedometers. Feed it samples as
 * they arrive; it calls onStep once per detected footfall.
 */
export function createStepCounter({ stepLengthMeters, onStep }: StepCounterOptions) {
  let baseline: number | null = null;
  let armed = true;
  let lastStepAt = 0;
  let stepCount = 0;

  return {
    addSample(sample: MotionSample) {
      const magnitude = Math.hypot(
        sample.accelerationX,
        sample.accelerationY,
        sample.accelerationZ,
      );

      if (baseline === null) {
        baseline = magnitude;
        return;
      }

      const deviation = magnitude - baseline;
      baseline += BASELINE_SMOOTHING * (magnitude - baseline);

      if (
        armed &&
        deviation > STEP_PEAK_THRESHOLD &&
        sample.timestampMs - lastStepAt > MIN_STEP_INTERVAL_MS
      ) {
        stepCount += 1;
        lastStepAt = sample.timestampMs;
        armed = false;
        onStep({ stepCount, distanceMeters: stepCount * stepLengthMeters });
      } else if (!armed && deviation < STEP_RESET_THRESHOLD) {
        armed = true;
      }
    },
  };
}
