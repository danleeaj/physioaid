import type { ChairStandMetrics, VisionMetrics } from "@/types/assessment";

export function getDemoChairStandMetrics(): ChairStandMetrics {
  return {
    completionStatus: "demo",
    durationSeconds: 16,
    repetitions: 5,
    movementQuality: "variable",
    source: "demo",
  };
}

export function getDemoVisionMetrics(): VisionMetrics {
  return {
    detectedRepetitions: 5,
    estimatedDurationSeconds: 16,
    source: "demo",
  };
}
