import { summarizeGaitMetrics } from "@/lib/sensors/gait-metrics";
import type { MotionMetrics } from "@/types/assessment";
import type { MotionSample } from "@/types/motion";

export function getDemoMotionMetrics(): MotionMetrics {
  return {
    stabilityScore: 0.62,
    rhythmConsistency: 0.58,
    gaitSpeedMetersPerSecond: 0.82,
    completionStatus: "demo",
    source: "demo",
  };
}

export function getUnavailableMotionMetrics(
  source: "accelerometer" | "manual" = "manual",
): MotionMetrics {
  return {
    stabilityScore: 0,
    rhythmConsistency: 0,
    completionStatus: "stopped",
    source,
  };
}

export function summarizeMotionSamples(input: {
  samples: MotionSample[];
  distanceMeters?: number;
  durationSeconds: number;
  stepLengthMeters?: number;
}): MotionMetrics {
  const metrics = summarizeGaitMetrics(input);

  if (metrics.completionStatus === "stopped") {
    return getUnavailableMotionMetrics("accelerometer");
  }

  return {
    stabilityScore: metrics.stabilityScore,
    rhythmConsistency: metrics.rhythmConsistency,
    gaitSpeedMetersPerSecond: metrics.gaitSpeedMetersPerSecond,
    estimatedGaitSpeedMetersPerSecond:
      metrics.estimatedGaitSpeedMetersPerSecond,
    gaitSpeedEstimateSource: metrics.gaitSpeedEstimateSource,
    stepCount: metrics.stepCount,
    cadenceStepsPerMinute: metrics.cadenceStepsPerMinute,
    stepTimeMeanSeconds: metrics.stepTimeMeanSeconds,
    stepTimeVariability: metrics.stepTimeVariability,
    jerkVariability: metrics.jerkVariability,
    rotationVariability: metrics.rotationVariability,
    cycleQualityScore: metrics.cycleQualityScore,
    completionStatus: "completed",
    source: "accelerometer",
  };
}
