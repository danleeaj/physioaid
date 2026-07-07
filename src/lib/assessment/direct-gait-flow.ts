import { summarizeMotionSamples } from "@/lib/sensors/motion-summary";
import type { FunctionalTestGate } from "@/lib/functional-tests/gates";
import type { MotionMetrics } from "@/types/assessment";
import type { MotionSample } from "@/types/motion";

export const DIRECT_GAIT_TEST_VERSION = "gait-test-2026.07.07.1";

export type DirectGaitState = {
  gaitPhase: "demo" | "start" | "manual";
  motion: MotionMetrics;
};

export const directGaitChairStandGate: FunctionalTestGate = {
  canProceed: true,
  reason:
    "Direct gait test route bypasses sit-to-stand only outside the assessment flow.",
};

export function createDirectGaitState(): DirectGaitState {
  return {
    gaitPhase: "start",
    motion: {
      stabilityScore: 0,
      rhythmConsistency: 0,
      source: "manual",
    },
  };
}

export function summarizeDirectGaitRun(input: {
  samples: MotionSample[];
  durationSeconds: number;
  stepLengthMeters?: number;
}): MotionMetrics {
  return summarizeMotionSamples(input);
}

export function stopDirectGaitRun(): MotionMetrics {
  return {
    completionStatus: "stopped",
    stabilityScore: 0.3,
    rhythmConsistency: 0.35,
    source: "manual",
  };
}
