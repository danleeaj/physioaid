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

export function getUnavailableMotionMetrics(): MotionMetrics {
  return {
    stabilityScore: 0,
    rhythmConsistency: 0,
    completionStatus: "stopped",
    source: "manual",
  };
}

export function summarizeMotionSamples(input: {
  samples: MotionSample[];
  distanceMeters?: number;
  durationSeconds: number;
}): MotionMetrics {
  if (input.samples.length === 0 || input.durationSeconds <= 0) {
    return getUnavailableMotionMetrics();
  }

  const magnitudes = input.samples.map((sample) =>
    Math.hypot(
      sample.accelerationX,
      sample.accelerationY,
      sample.accelerationZ,
    ),
  );
  const averageMagnitude =
    magnitudes.reduce((total, value) => total + value, 0) / magnitudes.length;
  const variance =
    magnitudes.reduce(
      (total, value) => total + (value - averageMagnitude) ** 2,
      0,
    ) / magnitudes.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    stabilityScore: clamp01(1 - standardDeviation / 12),
    rhythmConsistency: clamp01(1 - standardDeviation / 8),
    gaitSpeedMetersPerSecond:
      input.distanceMeters !== undefined
        ? Number((input.distanceMeters / input.durationSeconds).toFixed(2))
        : undefined,
    completionStatus: "completed",
    source: "accelerometer",
  };
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, Number(value.toFixed(2))));
}
