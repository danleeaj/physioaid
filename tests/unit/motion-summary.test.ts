import { describe, expect, test } from "bun:test";
import {
  getUnavailableMotionMetrics,
  summarizeMotionSamples,
} from "../../src/lib/sensors/motion-summary";
import type { MotionSample } from "../../src/types/motion";

function regularWalk(seconds: number, hz = 50): MotionSample[] {
  return Array.from({ length: Math.floor(seconds * hz) }, (_, index) => {
    const t = index / hz;
    const phase = 2 * Math.PI * 2 * t;
    return {
      timestampMs: t * 1000,
      accelerationX: Math.sin(phase) * 0.55,
      accelerationY: Math.cos(phase) * 0.25,
      accelerationZ: 9.81 + Math.sin(phase) * 1.1,
      rotationAlpha: Math.sin(phase) * 8,
      rotationBeta: Math.cos(phase) * 5,
      rotationGamma: Math.sin(phase) * 3,
    };
  });
}

describe("summarizeMotionSamples", () => {
  test("maps detailed gait metrics onto MotionMetrics", () => {
    const metrics = summarizeMotionSamples({
      durationSeconds: 25,
      samples: regularWalk(25),
      stepLengthMeters: 0.68,
    });

    expect(metrics.completionStatus).toBe("completed");
    expect(metrics.source).toBe("accelerometer");
    expect(metrics.stepCount).toBeGreaterThanOrEqual(45);
    expect(metrics.cadenceStepsPerMinute).toBeGreaterThan(100);
    expect(metrics.rhythmConsistency).toBeGreaterThan(0.8);
    expect(metrics.stabilityScore).toBeGreaterThan(0.55);
    expect(metrics.gaitSpeedEstimateSource).toBe("estimated_step_length");
    expect(metrics.estimatedGaitSpeedMetersPerSecond).toBe(
      metrics.gaitSpeedMetersPerSecond,
    );
    expect(metrics.analysisMode).toMatch(
      /^(heuristic|reconstruction_full|reconstruction_reduced)$/,
    );
    expect(metrics.absoluteEstimateMethod).toBe("height_regression");
  });

  test("labels calibrated step length estimates", () => {
    const metrics = summarizeMotionSamples({
      durationSeconds: 25,
      samples: regularWalk(25),
      stepLengthMeters: 0.62,
      stepLengthEstimateMethod: "calibration_walk",
    });

    expect(metrics.completionStatus).toBe("completed");
    expect(metrics.gaitSpeedEstimateSource).toBe("estimated_step_length");
    expect(metrics.absoluteEstimateMethod).toBe("calibration_walk");
  });

  test("maps reduced reconstruction when gyro is absent", () => {
    const samples = regularWalk(25).map((sample) => ({
      timestampMs: sample.timestampMs,
      accelerationX: sample.accelerationX,
      accelerationY: sample.accelerationY,
      accelerationZ: sample.accelerationZ,
    }));

    const metrics = summarizeMotionSamples({
      durationSeconds: 25,
      samples,
      stepLengthMeters: 0.68,
    });

    expect(metrics.completionStatus).toBe("completed");
    expect(metrics.source).toBe("accelerometer");
    expect(metrics.analysisMode).toBe("reconstruction_reduced");
    expect(metrics.trajectoryShape?.verticalExcursionM).toBeGreaterThan(0);
    expect(metrics.trajectoryShape?.forwardExcursionM).toBeUndefined();
  });

  test("uses explicit distance as the gait speed source when provided", () => {
    const metrics = summarizeMotionSamples({
      distanceMeters: 20,
      durationSeconds: 25,
      samples: regularWalk(25),
      stepLengthMeters: 0.68,
    });

    expect(metrics.gaitSpeedMetersPerSecond).toBe(0.8);
    expect(metrics.gaitSpeedEstimateSource).toBe("course_distance");
  });

  test("does not fabricate passing metrics when no samples are captured", () => {
    const metrics = summarizeMotionSamples({
      durationSeconds: 25,
      samples: [],
      stepLengthMeters: 0.68,
    });

    expect(metrics).toEqual(getUnavailableMotionMetrics("accelerometer"));
  });
});
