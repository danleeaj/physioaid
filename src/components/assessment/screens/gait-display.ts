import type { MotionMetrics } from "@/types/assessment";

export type GaitDisplayItem = {
  label: string;
  value: string;
};

export function gaitSpeedLabel(motion: MotionMetrics) {
  if (motion.absoluteEstimateMethod === "course_distance") {
    return "Course speed";
  }
  if (motion.absoluteEstimateMethod === "calibration_walk") {
    return "Calibration speed";
  }
  if (motion.gaitSpeedMetersPerSecond !== undefined) {
    return "Estimated speed";
  }
  return "Gait speed";
}

export function analysisModeLabel(mode: MotionMetrics["analysisMode"]) {
  switch (mode) {
    case "reconstruction_full":
      return "Full sensor";
    case "reconstruction_reduced":
      return "Reduced sensor";
    case "heuristic":
      return "Heuristic";
    default:
      return "Not measured";
  }
}

export function shapeResultItem(
  motion: MotionMetrics,
): GaitDisplayItem | null {
  const shape = motion.trajectoryShape;
  if (shape?.symmetry !== undefined) {
    return {
      label: "Symmetry",
      value: `${Math.round(shape.symmetry * 100)}%`,
    };
  }
  if (shape?.verticalExcursionM !== undefined) {
    return {
      label: "Vertical motion",
      value: `${Math.round(shape.verticalExcursionM * 100)} cm`,
    };
  }
  return null;
}

export function speedSourceLabel(motion: MotionMetrics) {
  if (motion.absoluteEstimateMethod === "course_distance") {
    return "Course distance";
  }
  if (motion.absoluteEstimateMethod === "calibration_walk") {
    return "Calibration walk";
  }
  if (motion.absoluteEstimateMethod === "height_regression") {
    return "Estimated";
  }
  return "Not measured";
}
