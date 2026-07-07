import {
  detectGaitCycles,
  stepIntervalsSeconds,
} from "@/lib/sensors/gait-cycle";
import {
  accelerationMagnitude,
  clamp01,
  estimateSampleRateHz,
  median,
  medianAbsoluteDeviation,
  rms,
  validMotionSamples,
} from "@/lib/sensors/gait-protocol";
import type { MotionSample } from "@/types/motion";

const MIN_DISTANCE_METERS = 3;
const MAX_DISTANCE_METERS = 20;
const MIN_VALID_SAMPLES = 120;
const MIN_SAMPLE_RATE_HZ = 20;
const LOW_MOTION_WINDOW_MS = 1500;
const LOW_MOTION_RANGE = 0.22;
const LOW_ROTATION_RMS = 25;
const MIN_STEP_LENGTH_METERS = 0.25;
const MAX_STEP_LENGTH_METERS = 1.2;
const MIN_QUALITY_SCORE = 0.55;

export type GaitSessionCalibration = {
  calibratedStepLengthMeters: number;
  calibrationDistanceMeters: number;
  calibrationWalkDurationSeconds: number;
  calibrationStepCount: number;
  calibrationQualityScore: number;
  calibratedAt: string;
};

export type GaitCalibrationRejectReason =
  | "invalid_distance"
  | "insufficient_samples"
  | "insufficient_steps"
  | "no_clean_finish"
  | "implausible_step_length"
  | "low_quality";

export type GaitCalibrationResult =
  | {
      status: "accepted";
      calibration: GaitSessionCalibration;
      walkingSegment: {
        startMs: number;
        endMs: number;
      };
    }
  | {
      status: "rejected";
      reason: GaitCalibrationRejectReason;
    };

export function analyzeGaitCalibration(input: {
  samples: MotionSample[];
  enteredDistanceMeters: number;
  elapsedSeconds: number;
  now?: () => Date;
}): GaitCalibrationResult {
  const distanceMeters = input.enteredDistanceMeters;
  if (
    !Number.isFinite(distanceMeters) ||
    distanceMeters < MIN_DISTANCE_METERS ||
    distanceMeters > MAX_DISTANCE_METERS
  ) {
    return rejected("invalid_distance");
  }

  if (!Number.isFinite(input.elapsedSeconds) || input.elapsedSeconds <= 0) {
    return rejected("insufficient_samples");
  }

  const samples = validMotionSamples(input.samples);
  const sampleRateHz = estimateSampleRateHz(samples);
  if (samples.length < MIN_VALID_SAMPLES || sampleRateHz < MIN_SAMPLE_RATE_HZ) {
    return rejected("insufficient_samples");
  }

  const detected = detectGaitCycles(samples);
  const firstDetectedStep = detected.steps[0];
  if (!firstDetectedStep) {
    return rejected("insufficient_steps");
  }

  const standstillStartMs = findLowMotionWindowStart(
    samples,
    firstDetectedStep.timestampMs + 1200,
    LOW_MOTION_WINDOW_MS,
  );

  if (standstillStartMs === undefined) {
    return rejected("no_clean_finish");
  }

  const walkingSteps = detected.steps.filter(
    (step) => step.timestampMs < standstillStartMs,
  );
  const minimumSteps = minimumStepsForDistance(distanceMeters);
  if (walkingSteps.length < minimumSteps) {
    return rejected("insufficient_steps");
  }

  const intervals = stepIntervalsSeconds(walkingSteps);
  const medianIntervalMs = Math.max(
    300,
    Math.min(1400, median(intervals) * 1000),
  );
  const segmentStartMs = Math.max(
    samples[0].timestampMs,
    walkingSteps[0].timestampMs - medianIntervalMs * 0.5,
  );
  const segmentEndMs = standstillStartMs;
  const durationSeconds = (segmentEndMs - segmentStartMs) / 1000;
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return rejected("low_quality");
  }

  const calibratedStepLengthMeters = distanceMeters / walkingSteps.length;
  if (
    calibratedStepLengthMeters < MIN_STEP_LENGTH_METERS ||
    calibratedStepLengthMeters > MAX_STEP_LENGTH_METERS
  ) {
    return rejected("implausible_step_length");
  }

  const qualityScore = calibrationQualityScore({
    distanceMeters,
    intervals,
    sampleRateHz,
    stepCount: walkingSteps.length,
  });

  if (qualityScore < MIN_QUALITY_SCORE) {
    return rejected("low_quality");
  }

  return {
    status: "accepted",
    walkingSegment: {
      startMs: Math.round(segmentStartMs),
      endMs: Math.round(segmentEndMs),
    },
    calibration: {
      calibratedStepLengthMeters: round(calibratedStepLengthMeters, 3),
      calibrationDistanceMeters: round(distanceMeters, 2),
      calibrationWalkDurationSeconds: round(durationSeconds, 2),
      calibrationStepCount: walkingSteps.length,
      calibrationQualityScore: qualityScore,
      calibratedAt: (input.now?.() ?? new Date()).toISOString(),
    },
  };
}

export function nextSessionCalibration(
  current: GaitSessionCalibration | undefined,
  result: GaitCalibrationResult,
): GaitSessionCalibration | undefined {
  return result.status === "accepted" ? result.calibration : current;
}

function rejected(reason: GaitCalibrationRejectReason): GaitCalibrationResult {
  return { status: "rejected", reason };
}

function minimumStepsForDistance(distanceMeters: number): number {
  return Math.max(4, Math.ceil(distanceMeters / MAX_STEP_LENGTH_METERS));
}

function findLowMotionWindowStart(
  samples: MotionSample[],
  afterTimestampMs: number,
  windowMs: number,
): number | undefined {
  for (let startIndex = 0; startIndex < samples.length; startIndex += 1) {
    const windowStartMs = samples[startIndex].timestampMs;
    if (windowStartMs < afterTimestampMs) continue;

    const windowEndMs = windowStartMs + windowMs;
    let endIndex = startIndex;
    while (
      endIndex < samples.length &&
      samples[endIndex].timestampMs <= windowEndMs
    ) {
      endIndex += 1;
    }

    const windowSamples = samples.slice(startIndex, endIndex);
    const actualWindowMs =
      (windowSamples.at(-1)?.timestampMs ?? windowStartMs) - windowStartMs;

    if (actualWindowMs < windowMs * 0.85) continue;
    if (isLowMotionWindow(windowSamples)) return windowStartMs;
  }

  return undefined;
}

function isLowMotionWindow(samples: MotionSample[]): boolean {
  const magnitudes = samples.map(accelerationMagnitude);
  const signalRange = Math.max(...magnitudes) - Math.min(...magnitudes);
  const rotation = rms(
    samples.map((sample) =>
      Math.hypot(
        sample.rotationAlpha ?? 0,
        sample.rotationBeta ?? 0,
        sample.rotationGamma ?? 0,
      ),
    ),
  );

  return signalRange <= LOW_MOTION_RANGE && rotation <= LOW_ROTATION_RMS;
}

function calibrationQualityScore(input: {
  distanceMeters: number;
  intervals: number[];
  sampleRateHz: number;
  stepCount: number;
}): number {
  const sampleRateScore = clamp01(input.sampleRateHz / 50);
  const stepCoverage = clamp01(
    input.stepCount / Math.max(4, input.distanceMeters / 0.65),
  );
  const rhythmScore =
    input.intervals.length >= 2
      ? clamp01(1 - robustCoefficientOfVariation(input.intervals) / 0.35)
      : 0.45;

  return clamp01(
    sampleRateScore * 0.3 + stepCoverage * 0.3 + rhythmScore * 0.3 + 0.1,
  );
}

function robustCoefficientOfVariation(values: number[]): number {
  const center = median(values);
  if (center === 0) return 1;
  return (medianAbsoluteDeviation(values) * 1.4826) / Math.abs(center);
}

function round(value: number, digits: number): number {
  return Number(value.toFixed(digits));
}
