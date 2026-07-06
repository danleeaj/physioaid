import { describe, expect, test } from "bun:test";
import {
  detectGaitCycles,
  stepIntervalsSeconds,
} from "../../src/lib/sensors/gait-cycle";
import type { MotionSample } from "../../src/types/motion";

function walkingSamples(seconds: number, hz = 50, stepHz = 2): MotionSample[] {
  return Array.from({ length: Math.floor(seconds * hz) }, (_, index) => {
    const t = index / hz;
    const phase = 2 * Math.PI * stepHz * t;
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

describe("detectGaitCycles", () => {
  test("detects regular steps from a 25 second synthetic walk", () => {
    const result = detectGaitCycles(walkingSamples(25));

    expect(result.steps.length).toBeGreaterThanOrEqual(45);
    expect(result.steps.length).toBeLessThanOrEqual(55);
    expect(result.stepIntervalsSeconds.length).toBe(result.steps.length - 1);
    expect(result.stepIntervalsSeconds[0]).toBeGreaterThan(0.45);
    expect(result.stepIntervalsSeconds[0]).toBeLessThan(0.55);
  });

  test("does not double count high-frequency noise as steps", () => {
    const result = detectGaitCycles(walkingSamples(25, 50, 5));

    expect(result.steps.length).toBeLessThanOrEqual(84);
    expect(Math.min(...result.stepIntervalsSeconds)).toBeGreaterThanOrEqual(0.3);
  });
});

describe("stepIntervalsSeconds", () => {
  test("returns intervals between detected step timestamps", () => {
    expect(
      stepIntervalsSeconds([
        { timestampMs: 1000, amplitude: 1 },
        { timestampMs: 1500, amplitude: 1 },
        { timestampMs: 2050, amplitude: 1 },
      ]),
    ).toEqual([0.5, 0.55]);
  });
});
