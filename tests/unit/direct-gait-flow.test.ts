import { describe, expect, test } from "bun:test";
import {
  createDirectGaitState,
  DIRECT_GAIT_TEST_VERSION,
  directGaitChairStandGate,
  stopDirectGaitRun,
  summarizeDirectGaitRun,
} from "../../src/lib/assessment/direct-gait-flow";
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

describe("direct gait flow", () => {
  test("starts directly on the live gait test while bypassing only chair stand", () => {
    const state = createDirectGaitState();

    expect(state.gaitPhase).toBe("start");
    expect(state.motion.completionStatus).toBeUndefined();
    expect(directGaitChairStandGate.canProceed).toBe(true);
  });

  test("exposes a visible direct gait test version marker", () => {
    expect(DIRECT_GAIT_TEST_VERSION).toBe("gait-test-2026.07.07.2");
  });

  test("summarizes a direct 15 second pocket walk as accelerometer metrics", () => {
    const metrics = summarizeDirectGaitRun({
      durationSeconds: 15,
      samples: regularWalk(15),
      stepLengthMeters: 0.68,
    });

    expect(metrics.completionStatus).toBe("completed");
    expect(metrics.source).toBe("accelerometer");
    expect(metrics.gaitSpeedEstimateSource).toBe("estimated_step_length");
    expect(metrics.absoluteEstimateMethod).toBe("height_regression");
    expect(metrics.stepCount).toBeGreaterThanOrEqual(25);
  });

  test("stopped direct gait runs remain blocked as manual stopped records", () => {
    const metrics = stopDirectGaitRun();

    expect(metrics.completionStatus).toBe("stopped");
    expect(metrics.source).toBe("manual");
    expect(metrics.stabilityScore).toBeLessThan(0.45);
  });
});
