import type { GaitSpeedEstimateSource } from "@/lib/sensors/gait-metrics";
import type {
  CycleRepresentation,
  TrajectoryShape,
} from "@/lib/sensors/gait-reconstruction/types";

export type AbsoluteEstimateMethod =
  | "height_regression"
  | "course_distance"
  | "none";

export function cycleIntervalsSeconds(peaks: number[], fs: number): number[] {
  return peaks.slice(1).map((peak, index) => (peak - peaks[index]) / fs);
}

export function inferStepsPerCycle(
  cycleCount: number,
  magnitudeStepCount: number,
): 1 | 2 {
  if (cycleCount <= 0 || magnitudeStepCount <= 0) return 2;
  const ratio = magnitudeStepCount / cycleCount;
  return ratio >= 1.5 ? 2 : 1;
}

export function trajectoryShape(
  canonical: CycleRepresentation | null,
): TrajectoryShape {
  if (!canonical) return {};

  return {
    verticalExcursionM: roundMetric(range(canonical.disp, 1)),
    forwardExcursionM: roundMetric(range(canonical.disp, 0)),
    lateralSwayM: roundMetric(range(canonical.disp, 2)),
    pathLengthM: roundMetric(pathLength(canonical.disp)),
    symmetry: roundScore(symmetryScore(canonical.disp)),
  };
}

export function verticalOnlyShape(vertical: Float64Array): TrajectoryShape {
  return { verticalExcursionM: roundMetric(rangeScalar(vertical)) };
}

export function absoluteEstimate(input: {
  distanceMeters?: number;
  stepLengthMeters?: number;
}): {
  method: AbsoluteEstimateMethod;
  gaitSpeedEstimateSource?: GaitSpeedEstimateSource;
} {
  if (input.distanceMeters !== undefined && input.distanceMeters > 0) {
    return {
      method: "course_distance",
      gaitSpeedEstimateSource: "course_distance",
    };
  }
  if (input.stepLengthMeters !== undefined && input.stepLengthMeters > 0) {
    return {
      method: "height_regression",
      gaitSpeedEstimateSource: "estimated_step_length",
    };
  }
  return { method: "none" };
}

export function mean(values: number[]): number {
  return values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;
}

export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const center = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - center) ** 2)));
}

function range(values: Float64Array, axis: 0 | 1 | 2): number {
  const axisValues: number[] = [];
  for (let i = axis; i < values.length; i += 3) axisValues.push(values[i]);
  return Math.max(...axisValues) - Math.min(...axisValues);
}

function rangeScalar(values: Float64Array): number {
  return values.length ? Math.max(...values) - Math.min(...values) : 0;
}

function pathLength(values: Float64Array): number {
  let total = 0;
  for (let i = 3; i < values.length; i += 3) {
    total += Math.hypot(
      values[i] - values[i - 3],
      values[i + 1] - values[i - 2],
      values[i + 2] - values[i - 1],
    );
  }
  return total;
}

function symmetryScore(values: Float64Array): number {
  const n = values.length / 3;
  const half = Math.floor(n / 2);
  let error = 0;
  let scale = 0;

  for (let i = 0; i < half; i += 1) {
    for (let axis = 0; axis < 3; axis += 1) {
      const a = values[i * 3 + axis];
      const b = values[(i + half) * 3 + axis];
      error += (a - b) ** 2;
      scale += a ** 2 + b ** 2;
    }
  }

  if (scale <= 1e-9) return 0;
  return Math.max(0, Math.min(1, 1 - Math.sqrt(error / scale)));
}

function roundMetric(value: number): number {
  return Number(value.toFixed(3));
}

function roundScore(value: number): number {
  return Math.min(1, Math.max(0, Number(value.toFixed(2))));
}
