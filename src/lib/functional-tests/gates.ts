import type {
  ChairStandMetrics,
  FloorRisingMetrics,
  MotionMetrics,
} from "@/types/assessment";

export type FunctionalTestGate = {
  canProceed: boolean;
  reason: string;
};

export function getChairStandGate(
  chairStand: ChairStandMetrics,
  blockedBySafety: boolean,
): FunctionalTestGate {
  const unsafe =
    blockedBySafety ||
    chairStand.completionStatus === "stopped" ||
    (chairStand.movementQuality === "unsafe" && chairStand.repetitions < 8) ||
    chairStand.repetitions < 5 ||
    chairStand.durationSeconds > 20;

  return {
    canProceed: !unsafe,
    reason: unsafe
      ? "Chair stand result does not support moving to the gait walking test."
      : "Chair stand gate passed.",
  };
}

export function getMotionGate(motion: MotionMetrics): FunctionalTestGate {
  const unsafe =
    motion.completionStatus === "stopped" ||
    motion.stabilityScore < 0.45 ||
    motion.rhythmConsistency < 0.5;

  return {
    canProceed: !unsafe,
    reason: unsafe
      ? "Motion gait result does not support moving to floor-rising."
      : "Motion gait gate passed.",
  };
}

export function getFloorRisingGate(
  floorRising: FloorRisingMetrics,
): FunctionalTestGate {
  const unsafe =
    floorRising.completionStatus === "stopped" ||
    floorRising.requiredAssistance;

  return {
    canProceed: !unsafe,
    reason: unsafe
      ? "Floor-rising was stopped or required assistance."
      : "Floor-rising gate passed or skipped safely.",
  };
}
