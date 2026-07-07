import type { MotionMetrics } from "@/types/assessment";

export type GaitDisplayItem = {
  label: string;
  value: string;
};

function formatOptionalNumber(value: number | undefined, suffix: string) {
  return value === undefined ? "Not measured" : `${value}${suffix}`;
}

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

export function gaitResultItems(motion: MotionMetrics): GaitDisplayItem[] {
  const shapeItem = shapeResultItem(motion);

  return [
    {
      label: gaitSpeedLabel(motion),
      value: `${motion.gaitSpeedMetersPerSecond ?? 0} m/s`,
    },
    {
      label: "Cadence",
      value: formatOptionalNumber(
        motion.cadenceStepsPerMinute,
        " steps/min",
      ),
    },
    {
      label: "Steps",
      value:
        motion.stepCount === undefined
          ? "Not measured"
          : String(motion.stepCount),
    },
    {
      label: "Rhythm",
      value: `${Math.round(motion.rhythmConsistency * 100)}%`,
    },
    {
      label: "Stability",
      value: `${Math.round(motion.stabilityScore * 100)}%`,
    },
    {
      label: "Quality",
      value: `${Math.round((motion.cycleQualityScore ?? 0) * 100)}%`,
    },
    {
      label: "Mode",
      value: analysisModeLabel(motion.analysisMode),
    },
    ...(shapeItem ? [shapeItem] : []),
  ];
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

export function gaitSourceLabel(motion: MotionMetrics) {
  if (motion.completionStatus === "stopped") {
    return "Stopped";
  }
  if (motion.source === "accelerometer") {
    return "Live sensor";
  }
  if (motion.source === "demo") {
    return "Demo result";
  }
  return "Manual entry";
}
