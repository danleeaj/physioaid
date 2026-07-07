import { describe, expect, test } from "bun:test";
import {
  analysisModeLabel,
  gaitSpeedLabel,
  shapeResultItem,
  speedSourceLabel,
} from "../../src/components/assessment/screens/gait-display";
import type { MotionMetrics } from "../../src/types/assessment";

function motion(patch: Partial<MotionMetrics>): MotionMetrics {
  return {
    stabilityScore: 0.7,
    rhythmConsistency: 0.7,
    source: "accelerometer",
    ...patch,
  };
}

describe("gait display helpers", () => {
  test("labels speed by estimate source", () => {
    expect(
      gaitSpeedLabel(
        motion({
          absoluteEstimateMethod: "course_distance",
          gaitSpeedMetersPerSecond: 0.8,
        }),
      ),
    ).toBe("Course speed");
    expect(
      gaitSpeedLabel(
        motion({
          absoluteEstimateMethod: "calibration_walk",
          gaitSpeedMetersPerSecond: 0.9,
        }),
      ),
    ).toBe("Calibration speed");
    expect(
      gaitSpeedLabel(
        motion({
          absoluteEstimateMethod: "height_regression",
          gaitSpeedMetersPerSecond: 0.9,
        }),
      ),
    ).toBe("Estimated speed");
    expect(gaitSpeedLabel(motion({}))).toBe("Gait speed");
  });

  test("labels speed source by estimate method", () => {
    expect(
      speedSourceLabel(
        motion({
          absoluteEstimateMethod: "calibration_walk",
        }),
      ),
    ).toBe("Calibration walk");
    expect(
      speedSourceLabel(
        motion({
          absoluteEstimateMethod: "height_regression",
        }),
      ),
    ).toBe("Estimated");
    expect(speedSourceLabel(motion({}))).toBe("Not measured");
  });

  test("labels reconstruction analysis mode", () => {
    expect(analysisModeLabel("reconstruction_full")).toBe("Full sensor");
    expect(analysisModeLabel("reconstruction_reduced")).toBe("Reduced sensor");
    expect(analysisModeLabel("heuristic")).toBe("Heuristic");
    expect(analysisModeLabel(undefined)).toBe("Not measured");
  });

  test("prefers symmetry shape, then vertical motion", () => {
    expect(
      shapeResultItem(
        motion({
          trajectoryShape: {
            symmetry: 0.72,
            verticalExcursionM: 0.061,
          },
        }),
      ),
    ).toEqual({ label: "Symmetry", value: "72%" });
    expect(
      shapeResultItem(
        motion({
          trajectoryShape: {
            verticalExcursionM: 0.061,
          },
        }),
      ),
    ).toEqual({ label: "Vertical motion", value: "6 cm" });
    expect(shapeResultItem(motion({}))).toBeNull();
  });
});
