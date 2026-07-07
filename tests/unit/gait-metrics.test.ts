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

function walkFromStepPattern(
  intervalsSeconds: number[],
  options?: { amplitudes?: number[]; stepLengthMeters?: number },
): MotionSample[] {
  const hz = 50;
  const seconds = 15;
  const stepTimes: { timestamp: number; amplitude: number }[] = [];
  let timestamp = 0.3;

  for (let index = 0; index <= intervalsSeconds.length; index += 1) {
    stepTimes.push({
      amplitude: options?.amplitudes?.[index] ?? 1.1,
      timestamp,
    });
    timestamp += intervalsSeconds[index] ?? 0.53;
  }

  return Array.from({ length: Math.floor(seconds * hz) }, (_, index) => {
    const t = index / hz;
    const phase = 2 * Math.PI * 1.88 * t;
    const pocketSignal = stepTimes.reduce((total, step) => {
      const distanceFromStep = t - step.timestamp;
      return (
        total +
        Math.exp(-(distanceFromStep ** 2) / (2 * 0.035 ** 2)) *
          step.amplitude
      );
    }, 0);

    return {
      timestampMs: t * 1000,
      accelerationX: Math.sin(phase) * 0.2,
      accelerationY: Math.cos(phase) * 0.1,
      accelerationZ: 9.81 + pocketSignal,
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

  for (let step = 0; timestampMs < 15_000; step += 1) {
    const intervalMs = intervalsMs[step % intervalsMs.length];
    const nextStepMs = timestampMs + intervalMs;
    while (timestampMs < nextStepMs && timestampMs < 15_000) {
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
  test("summarizes a regular 15 second walk", () => {
    const metrics = summarizeGaitMetrics({
      durationSeconds: 15,
      samples: regularWalk(15),
      stepLengthMeters: 0.68,
    });

    expect(metrics.completionStatus).toBe("completed");
    expect(metrics.stepCount).toBeGreaterThanOrEqual(25);
    expect(metrics.stepCount).toBeLessThanOrEqual(35);
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
      durationSeconds: 15,
      samples: regularWalk(15),
      stepLengthMeters: 0.68,
    });
    const irregular = summarizeGaitMetrics({
      durationSeconds: 15,
      samples: irregularWalk(),
      stepLengthMeters: 0.68,
    });

    expect(irregular.completionStatus).toBe("completed");
    expect(irregular.rhythmConsistency).toBeLessThan(regular.rhythmConsistency);
  });

  test("does not collapse rhythm for normal cadence with pocket interval artifacts", () => {
    const intervals = Array.from({ length: 28 }, (_, index) =>
      index % 4 === 0 ? 0.31 : index % 4 === 1 ? 0.89 : 0.47,
    );
    const metrics = summarizeGaitMetrics({
      durationSeconds: 15,
      samples: walkFromStepPattern(intervals),
      stepLengthMeters: 0.697,
    });

    expect(metrics.completionStatus).toBe("completed");
    expect(metrics.stepCount).toBeGreaterThanOrEqual(25);
    expect(metrics.cadenceStepsPerMinute).toBeGreaterThanOrEqual(108);
    expect(metrics.rhythmConsistency).toBeGreaterThan(0.55);
  });

  test("does not fail stability from a few loose-pocket amplitude spikes", () => {
    const intervals = Array.from({ length: 28 }, () => 0.53);
    const amplitudes = Array.from({ length: 29 }, (_, index) =>
      index % 10 === 0 ? 3.4 : index % 13 === 0 ? 0.35 : 1.1,
    );
    const metrics = summarizeGaitMetrics({
      durationSeconds: 15,
      samples: walkFromStepPattern(intervals, { amplitudes }),
      stepLengthMeters: 0.697,
    });

    expect(metrics.completionStatus).toBe("completed");
    expect(metrics.cadenceStepsPerMinute).toBeGreaterThanOrEqual(100);
    expect(metrics.stabilityScore).toBeGreaterThan(0.55);
  });

  test("uses explicit course distance over estimated step length for speed", () => {
    const metrics = summarizeGaitMetrics({
      distanceMeters: 12,
      durationSeconds: 15,
      samples: regularWalk(15),
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
