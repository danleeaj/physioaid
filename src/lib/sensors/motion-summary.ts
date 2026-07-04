import type { MotionMetrics } from "@/types/assessment";

export function getDemoMotionMetrics(): MotionMetrics {
  return {
    stabilityScore: 0.62,
    rhythmConsistency: 0.58,
    source: "demo",
  };
}
