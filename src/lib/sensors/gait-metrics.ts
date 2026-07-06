import { detectGaitCycles, type GaitStep } from "@/lib/sensors/gait-cycle";
import {
  clamp01,
  coefficientOfVariation,
  gaitProtocol,
  mean,
  rms,
  validMotionSamples,
  validateGaitCapture,
} from "@/lib/sensors/gait-protocol";
import type { MotionSample } from "@/types/motion";

export type GaitSpeedEstimateSource =
  | "course_distance"
  | "estimated_step_length";

export type DetailedGaitMetrics = {
  completionStatus: "completed" | "stopped";
  source: "accelerometer";
  stabilityScore: number;
  rhythmConsistency: number;
  stepCount: number;
  cadenceStepsPerMinute?: number;
  stepTimeMeanSeconds?: number;
  stepTimeVariability?: number;
  jerkVariability: number;
  rotationVariability: number;
  cycleQualityScore: number;
  gaitSpeedMetersPerSecond?: number;
  estimatedGaitSpeedMetersPerSecond?: number;
  gaitSpeedEstimateSource?: GaitSpeedEstimateSource;
};

export function summarizeGaitMetrics(input: {
  samples: MotionSample[];
  durationSeconds: number;
  distanceMeters?: number;
  stepLengthMeters?: number;
}): DetailedGaitMetrics {
  const samples = validMotionSamples(input.samples);
  const quality = validateGaitCapture({
    durationSeconds: input.durationSeconds,
    samples,
  });

  if (!quality.usable) {
    return stoppedMetrics();
  }

  const cycles = detectGaitCycles(samples);
  if (cycles.steps.length < gaitProtocol.minDetectedSteps) {
    return stoppedMetrics();
  }

  const intervals = cycles.stepIntervalsSeconds;
  const stepTimeMeanSeconds = Number(mean(intervals).toFixed(2));
  const stepTimeVariability = clamp01(coefficientOfVariation(intervals));
  const rhythmConsistency = scoreRhythmConsistency(intervals);
  const jerkVariability = scoreJerkVariability(samples, cycles.smoothedSignal);
  const rotationVariability = scoreRotationVariability(samples);
  const stabilityScore = scoreStability({
    jerkVariability,
    rotationVariability,
    steps: cycles.steps,
  });
  const speed = speedMetrics({
    distanceMeters: input.distanceMeters,
    durationSeconds: input.durationSeconds,
    stepCount: cycles.steps.length,
    stepLengthMeters: input.stepLengthMeters,
  });

  return {
    completionStatus: "completed",
    source: "accelerometer",
    stabilityScore,
    rhythmConsistency,
    stepCount: cycles.steps.length,
    cadenceStepsPerMinute: Number(
      ((cycles.steps.length / input.durationSeconds) * 60).toFixed(1),
    ),
    stepTimeMeanSeconds,
    stepTimeVariability,
    jerkVariability,
    rotationVariability,
    cycleQualityScore: scoreCycleQuality({
      detectedSteps: cycles.steps.length,
      durationSeconds: input.durationSeconds,
      rhythmConsistency,
      sampleRateHz: cycles.sampleRateHz,
    }),
    ...speed,
  };
}

function stoppedMetrics(): DetailedGaitMetrics {
  return {
    completionStatus: "stopped",
    source: "accelerometer",
    stabilityScore: 0,
    rhythmConsistency: 0,
    stepCount: 0,
    jerkVariability: 1,
    rotationVariability: 1,
    cycleQualityScore: 0,
  };
}

function scoreRhythmConsistency(intervals: number[]): number {
  if (intervals.length < 2) return 0;
  const intervalVariation = coefficientOfVariation(intervals);
  const averageInterval = mean(intervals);
  const stepFrequencyHz = averageInterval > 0 ? 1 / averageInterval : 0;
  const cadencePenalty =
    stepFrequencyHz < 0.7 || stepFrequencyHz > 3 ? 0.2 : 0;

  return clamp01(1 - intervalVariation / 0.35 - cadencePenalty);
}

function scoreJerkVariability(
  samples: MotionSample[],
  smoothedSignal: number[],
): number {
  const jerkValues: number[] = [];

  for (let index = 1; index < smoothedSignal.length; index += 1) {
    const seconds =
      (samples[index].timestampMs - samples[index - 1].timestampMs) / 1000;
    if (seconds > 0) {
      jerkValues.push(
        Math.abs((smoothedSignal[index] - smoothedSignal[index - 1]) / seconds),
      );
    }
  }

  return clamp01(rms(jerkValues) / 90);
}

function scoreRotationVariability(samples: MotionSample[]): number {
  const rotationMagnitudes = samples
    .map((sample) =>
      Math.hypot(
        sample.rotationAlpha ?? 0,
        sample.rotationBeta ?? 0,
        sample.rotationGamma ?? 0,
      ),
    )
    .filter((value) => value > 0);

  return clamp01(rms(rotationMagnitudes) / 160);
}

function scoreStability(input: {
  jerkVariability: number;
  rotationVariability: number;
  steps: GaitStep[];
}): number {
  const amplitudePenalty =
    input.steps.length >= 3
      ? clamp01(
          coefficientOfVariation(input.steps.map((step) => step.amplitude)) /
            0.8,
        )
      : 0.35;

  return clamp01(
    1 -
      (amplitudePenalty * 0.35 +
        input.rotationVariability * 0.25 +
        input.jerkVariability * 0.25),
  );
}

function scoreCycleQuality(input: {
  detectedSteps: number;
  durationSeconds: number;
  rhythmConsistency: number;
  sampleRateHz: number;
}): number {
  const expectedMinimumSteps = Math.max(
    gaitProtocol.minDetectedSteps,
    input.durationSeconds * 0.7,
  );
  const stepCoverage = clamp01(input.detectedSteps / expectedMinimumSteps);
  const sampleRateCoverage = clamp01(input.sampleRateHz / 50);

  return clamp01(
    stepCoverage * 0.35 +
      input.rhythmConsistency * 0.4 +
      sampleRateCoverage * 0.25,
  );
}

function speedMetrics(input: {
  distanceMeters?: number;
  durationSeconds: number;
  stepCount: number;
  stepLengthMeters?: number;
}): Pick<
  DetailedGaitMetrics,
  | "gaitSpeedMetersPerSecond"
  | "estimatedGaitSpeedMetersPerSecond"
  | "gaitSpeedEstimateSource"
> {
  if (
    input.distanceMeters !== undefined &&
    input.distanceMeters > 0 &&
    input.durationSeconds > 0
  ) {
    return {
      gaitSpeedMetersPerSecond: Number(
        (input.distanceMeters / input.durationSeconds).toFixed(2),
      ),
      gaitSpeedEstimateSource: "course_distance",
    };
  }

  if (
    input.stepLengthMeters !== undefined &&
    input.stepLengthMeters > 0 &&
    input.stepCount > 0 &&
    input.durationSeconds > 0
  ) {
    const estimated = Number(
      ((input.stepCount * input.stepLengthMeters) / input.durationSeconds).toFixed(
        2,
      ),
    );
    return {
      gaitSpeedMetersPerSecond: estimated,
      estimatedGaitSpeedMetersPerSecond: estimated,
      gaitSpeedEstimateSource: "estimated_step_length",
    };
  }

  return {};
}
