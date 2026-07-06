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

/**
 * Placeholder metrics for a completed guided run (Start 30s test → the
 * countdown finishes or Stop is pressed). Distinct from the demo metrics
 * above: `completionStatus: "completed"` marks it as a real record so it
 * unlocks the "Continue" action, matching the floor-rising camera placeholder.
 */
export function getGuidedChairStandMetrics(): ChairStandMetrics {
  return {
    completionStatus: "completed",
    durationSeconds: 16,
    repetitions: 5,
    movementQuality: "variable",
    source: "camera",
  };
}

export function getDemoVisionMetrics(): VisionMetrics {
  return {
    detectedRepetitions: 5,
    estimatedDurationSeconds: 16,
    source: "demo",
  };
}
