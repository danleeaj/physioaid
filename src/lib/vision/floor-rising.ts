import type { FloorRisingMetrics } from "@/types/assessment";

export function getCameraFloorRisingPlaceholder(): FloorRisingMetrics {
  return {
    completionStatus: "completed",
    durationSeconds: 18,
    requiredAssistance: false,
    movementQuality: "not_assessed",
    source: "camera",
  };
}

export function createManualFloorRisingMetrics(input: {
  durationSeconds?: number;
  requiredAssistance: boolean;
}): FloorRisingMetrics {
  return {
    completionStatus: input.requiredAssistance ? "stopped" : "completed",
    durationSeconds: input.durationSeconds,
    requiredAssistance: input.requiredAssistance,
    movementQuality: input.requiredAssistance ? "unsafe" : "not_assessed",
    source: "manual",
  };
}
