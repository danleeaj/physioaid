import type { FloorRisingMetrics } from "@/types/assessment";

export function getDemoFloorRisingMetrics(): FloorRisingMetrics {
  return {
    completionStatus: "demo",
    durationSeconds: 18,
    requiredAssistance: false,
    source: "demo",
  };
}

export function getSkippedFloorRisingMetrics(): FloorRisingMetrics {
  return {
    completionStatus: "skipped",
    requiredAssistance: false,
    source: "manual",
  };
}
