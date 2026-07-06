import { describe, expect, test } from "bun:test";
import { summarizeGaitMetrics } from "../../src/lib/sensors/gait-metrics";
import type { MotionSample } from "../../src/types/motion";

function regularWalk(seconds: number, hz = 50, stepHz = 2): MotionSample[] {
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

function irregularWalk(): MotionSample[] {
  const samples: MotionSample[] = [];
  let timestampMs = 0;
  const intervalsMs = [420, 720, 380, 850, 500, 680, 460, 900];

  for (let step = 0; timestampMs < 25_000; step += 1) {
    const intervalMs = intervalsMs[step % intervalsMs.length];
    const nextStepMs = timestampMs + intervalMs;
    while (timestampMs < nextStepMs && timestampMs < 25_000) {
      const phase = ((timestampMs % intervalMs) / intervalMs) * 2 * Math.PI;
      samples.push({
        timestampMs,
        accelerationX: Math.sin(phase) * 0.5,
        accelerationY: Math.cos(phase) * 0.25,
        accelerationZ: 9.81 + Math.sin(phase) * 1.05,
        rotationAlpha: Math.sin(phase) * 7,
        rotationBeta: Math.cos(phase) * 5,
        rotationGamma: Math.sin(phase) * 3,
      });
      timestampMs += 20;
    }
  }

  return samples;
}

describe("summarizeGaitMetrics", () => {
  test("summarizes a regular 25 second walk", () => {
    const metrics = summarizeGaitMetrics({
      durationSeconds: 25,
      samples: regularWalk(25),
      stepLengthMeters: 0.68,
    });

    expect(metrics.completionStatus).toBe("completed");
    expect(metrics.stepCount).toBeGreaterThanOrEqual(45);
    expect(metrics.stepCount).toBeLessThanOrEqual(55);
    expect(metrics.cadenceStepsPerMinute).toBeGreaterThanOrEqual(108);
    expect(metrics.cadenceStepsPerMinute).toBeLessThanOrEqual(132);
    expect(metrics.rhythmConsistency).toBeGreaterThan(0.8);
    expect(metrics.stabilityScore).toBeGreaterThan(0.55);
    expect(metrics.cycleQualityScore).toBeGreaterThan(0.75);
    expect(metrics.gaitSpeedEstimateSource).toBe("estimated_step_length");
    expect(metrics.estimatedGaitSpeedMetersPerSecond).toBeGreaterThan(1);
  });

  test("scores irregular step timing lower than regular timing", () => {
    const regular = summarizeGaitMetrics({
      durationSeconds: 25,
      samples: regularWalk(25),
      stepLengthMeters: 0.68,
    });
    const irregular = summarizeGaitMetrics({
      durationSeconds: 25,
      samples: irregularWalk(),
      stepLengthMeters: 0.68,
    });

    expect(irregular.completionStatus).toBe("completed");
    expect(irregular.rhythmConsistency).toBeLessThan(regular.rhythmConsistency);
  });

  test("uses explicit course distance over estimated step length for speed", () => {
    const metrics = summarizeGaitMetrics({
      distanceMeters: 20,
      durationSeconds: 25,
      samples: regularWalk(25),
      stepLengthMeters: 0.68,
    });

    expect(metrics.gaitSpeedMetersPerSecond).toBe(0.8);
    expect(metrics.gaitSpeedEstimateSource).toBe("course_distance");
  });

  test("returns stopped metrics for unusable captures", () => {
    const metrics = summarizeGaitMetrics({
      durationSeconds: 10,
      samples: regularWalk(10),
      stepLengthMeters: 0.68,
    });

    expect(metrics.completionStatus).toBe("stopped");
    expect(metrics.stepCount).toBe(0);
    expect(metrics.stabilityScore).toBe(0);
    expect(metrics.rhythmConsistency).toBe(0);
  });
});
