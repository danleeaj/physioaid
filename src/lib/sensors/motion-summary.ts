import type { MotionMetrics } from "@/types/assessment";

export function getDemoMotionMetrics(): MotionMetrics {
  return {
    stabilityScore: 0.62,
    rhythmConsistency: 0.58,
    gaitSpeedMetersPerSecond: 0.82,
    completionStatus: "demo",
    source: "demo",
  };
}
