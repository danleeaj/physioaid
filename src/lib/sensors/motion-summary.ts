import { analyzeGaitReconstruction } from "@/lib/sensors/gait-reconstruction/analyze";
import type { MotionMetrics } from "@/types/assessment";
import type { MotionSample } from "@/types/motion";

export function getDemoMotionMetrics(): MotionMetrics {
  return {
    stabilityScore: 0.62,
    rhythmConsistency: 0.58,
    gaitSpeedMetersPerSecond: 0.82,
    absoluteEstimateMethod: "height_regression",
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
    absoluteEstimateMethod: "none",
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
  const metrics = analyzeGaitReconstruction(input);

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
    analysisMode:
      metrics.mode === "full"
        ? "reconstruction_full"
        : metrics.mode === "reduced"
          ? "reconstruction_reduced"
          : "heuristic",
    absoluteEstimateMethod: metrics.absoluteEstimateMethod,
    trajectoryShape:
      Object.keys(metrics.shape).length > 0 ? metrics.shape : undefined,
    stepCount: metrics.stepCount,
    cadenceStepsPerMinute: metrics.cadenceStepsPerMinute,
    stepTimeMeanSeconds: metrics.stepTimeMeanSeconds,
    stepTimeVariability: metrics.stepTimeVariability,
    jerkVariability: metrics.jerkVariability,
    rotationVariability: metrics.rotationVariability,
    cycleQualityScore: metrics.quality,
    completionStatus: "completed",
    source: "accelerometer",
  };
}
