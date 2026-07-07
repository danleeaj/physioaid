import { detectGaitCycles } from "@/lib/sensors/gait-cycle";
import {
  aggregateCycles,
} from "@/lib/sensors/gait-reconstruction/aggregate";
import { cycleAttitude } from "@/lib/sensors/gait-reconstruction/attitude";
import { calibrateHeading } from "@/lib/sensors/gait-reconstruction/heading";
import {
  absoluteEstimate,
  cycleIntervalsSeconds,
  inferStepsPerCycle,
  mean,
  standardDeviation,
  trajectoryShape,
  verticalOnlyShape,
} from "@/lib/sensors/gait-reconstruction/parameters";
import { reconstructCycle } from "@/lib/sensors/gait-reconstruction/reconstruct";
import { resampleGaitSeries } from "@/lib/sensors/gait-reconstruction/resample";
import { segmentGaitCycles } from "@/lib/sensors/gait-reconstruction/segment";
import type {
  CycleRepresentation,
  GaitReconstructionResult,
} from "@/lib/sensors/gait-reconstruction/types";
import { summarizeGaitMetrics } from "@/lib/sensors/gait-metrics";
import {
  validMotionSamples,
  validateGaitCapture,
} from "@/lib/sensors/gait-protocol";
import type { MotionSample } from "@/types/motion";

export type GaitReconstructionInput = {
  samples: MotionSample[];
  durationSeconds: number;
  distanceMeters?: number;
  stepLengthMeters?: number;
};

export type GaitReconstructionSummary = GaitReconstructionResult & {
  stabilityScore: number;
  rhythmConsistency: number;
  stepCount: number;
  gaitSpeedMetersPerSecond?: number;
  estimatedGaitSpeedMetersPerSecond?: number;
  gaitSpeedEstimateSource?: "course_distance" | "estimated_step_length";
  absoluteEstimateMethod: "height_regression" | "course_distance" | "none";
  stepTimeMeanSeconds?: number;
  stepTimeVariability?: number;
  jerkVariability?: number;
  rotationVariability?: number;
};

export function analyzeGaitReconstruction(
  input: GaitReconstructionInput,
): GaitReconstructionSummary {
  const samples = validMotionSamples(input.samples);
  const quality = validateGaitCapture({
    samples,
    durationSeconds: input.durationSeconds,
  });
  const heuristic = summarizeGaitMetrics(input);
  const estimate = absoluteEstimate(input);

  if (!quality.usable) {
    return stoppedSummary(quality.issue, estimate.method);
  }

  try {
    const series = resampleGaitSeries(samples);
    const peaks = segmentGaitCycles(series);
    if (peaks.length < 3) return heuristicOrStopped(heuristic, estimate.method);

    const magnitude = detectGaitCycles(samples);
    const intervals = cycleIntervalsSeconds(peaks, series.fs);
    const averageCycleTime = mean(intervals);
    const cycleCount = Math.max(0, peaks.length - 1);
    const stepsPerCycle = inferStepsPerCycle(cycleCount, magnitude.steps.length);

    if (!series.gyro) {
      return {
        ...heuristicFields(heuristic),
        completionStatus: "completed",
        mode: "reduced",
        cycleCount,
        cycleTimeS: round(averageCycleTime),
        cycleTimeVariabilityS: round(standardDeviation(intervals)),
        cadenceStepsPerMinute: round(
          (stepsPerCycle * 60) / averageCycleTime,
          1,
        ),
        stepsPerCycle,
        canonical: null,
        perCycle: [],
        shape: verticalOnlyShape(reconstructVertical(series, peaks[0], peaks[1])),
        quality: heuristic.cycleQualityScore,
        absoluteEstimateMethod: estimate.method,
      };
    }

    const cycles: CycleRepresentation[] = [];
    for (let i = 0; i < peaks.length - 1; i += 1) {
      const attitude = cycleAttitude(series, peaks[i], peaks[i + 1]);
      cycles.push(
        calibrateHeading(
          reconstructCycle(series, attitude, peaks[i], peaks[i + 1]),
        ),
      );
    }
    const canonical = aggregateCycles(cycles);

    return {
      ...heuristicFields(heuristic),
      completionStatus: "completed",
      mode: "full",
      cycleCount,
      cycleTimeS: round(averageCycleTime),
      cycleTimeVariabilityS: round(standardDeviation(intervals)),
      cadenceStepsPerMinute: round((stepsPerCycle * 60) / averageCycleTime, 1),
      stepsPerCycle,
      canonical,
      perCycle: cycles,
      shape: trajectoryShape(canonical),
      quality: heuristic.cycleQualityScore,
      absoluteEstimateMethod: estimate.method,
    };
  } catch (error) {
    return heuristicOrStopped(
      heuristic,
      estimate.method,
      error instanceof Error ? error.message : "reconstruction_failed",
    );
  }
}

function heuristicFields(
  heuristic: ReturnType<typeof summarizeGaitMetrics>,
): Pick<
  GaitReconstructionSummary,
  | "stabilityScore"
  | "rhythmConsistency"
  | "stepCount"
  | "gaitSpeedMetersPerSecond"
  | "estimatedGaitSpeedMetersPerSecond"
  | "gaitSpeedEstimateSource"
  | "stepTimeMeanSeconds"
  | "stepTimeVariability"
  | "jerkVariability"
  | "rotationVariability"
> {
  return {
    stabilityScore: heuristic.stabilityScore,
    rhythmConsistency: heuristic.rhythmConsistency,
    stepCount: heuristic.stepCount,
    gaitSpeedMetersPerSecond: heuristic.gaitSpeedMetersPerSecond,
    estimatedGaitSpeedMetersPerSecond: heuristic.estimatedGaitSpeedMetersPerSecond,
    gaitSpeedEstimateSource: heuristic.gaitSpeedEstimateSource,
    stepTimeMeanSeconds: heuristic.stepTimeMeanSeconds,
    stepTimeVariability: heuristic.stepTimeVariability,
    jerkVariability: heuristic.jerkVariability,
    rotationVariability: heuristic.rotationVariability,
  };
}

function heuristicOrStopped(
  heuristic: ReturnType<typeof summarizeGaitMetrics>,
  method: GaitReconstructionSummary["absoluteEstimateMethod"],
  failureReason = "reconstruction_unavailable",
): GaitReconstructionSummary {
  if (heuristic.completionStatus === "completed") {
    return {
      ...heuristicFields(heuristic),
      completionStatus: "completed",
      mode: "heuristic",
      cycleCount: 0,
      canonical: null,
      perCycle: [],
      shape: {},
      quality: heuristic.cycleQualityScore,
      absoluteEstimateMethod: method,
      failureReason,
    };
  }

  return stoppedSummary(failureReason, method);
}

function stoppedSummary(
  failureReason: string,
  method: GaitReconstructionSummary["absoluteEstimateMethod"] = "none",
): GaitReconstructionSummary {
  return {
    completionStatus: "stopped",
    mode: "heuristic",
    cycleCount: 0,
    canonical: null,
    perCycle: [],
    shape: {},
    quality: 0,
    stabilityScore: 0,
    rhythmConsistency: 0,
    stepCount: 0,
    absoluteEstimateMethod: method,
    failureReason,
  };
}

function reconstructVertical(
  series: { accel: Float64Array; fs: number },
  p0: number,
  p1: number,
): Float64Array {
  const length = p1 - p0;
  const dt = 1 / series.fs;
  const acceleration = new Float64Array(length);
  const velocity = new Float64Array(length);
  const displacement = new Float64Array(length);

  for (let i = 0; i < length; i += 1) {
    acceleration[i] = series.accel[(p0 + i) * 3 + 1];
  }

  const averageAcceleration = mean(Array.from(acceleration));
  for (let i = 0; i < length; i += 1) acceleration[i] -= averageAcceleration;

  for (let i = 1; i < length; i += 1) {
    velocity[i] =
      velocity[i - 1] + 0.5 * (acceleration[i] + acceleration[i - 1]) * dt;
  }

  const averageVelocity = mean(Array.from(velocity));
  for (let i = 0; i < length; i += 1) velocity[i] -= averageVelocity;

  for (let i = 1; i < length; i += 1) {
    displacement[i] =
      displacement[i - 1] + 0.5 * (velocity[i] + velocity[i - 1]) * dt;
  }

  return displacement;
}

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}
