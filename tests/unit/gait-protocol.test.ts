import { describe, expect, test } from "bun:test";
import {
  gaitProtocol,
  validateGaitCapture,
  validMotionSamples,
} from "../../src/lib/sensors/gait-protocol";
import type { MotionSample } from "../../src/types/motion";

function sampleAt(index: number, hz = 50, amplitude = 1): MotionSample {
  const t = index / hz;
  return {
    timestampMs: t * 1000,
    accelerationX: Math.sin(2 * Math.PI * 2 * t) * amplitude,
    accelerationY: Math.cos(2 * Math.PI * 2 * t) * amplitude * 0.35,
    accelerationZ: 9.81 + Math.sin(2 * Math.PI * 2 * t) * amplitude,
    rotationAlpha: Math.sin(2 * Math.PI * 2 * t) * 8,
    rotationBeta: Math.cos(2 * Math.PI * 2 * t) * 5,
    rotationGamma: Math.sin(2 * Math.PI * 2 * t) * 3,
  };
}

function walkingSamples(
  seconds: number,
  hz = 50,
  amplitude = 1,
): MotionSample[] {
  return Array.from({ length: Math.floor(seconds * hz) }, (_, index) =>
    sampleAt(index, hz, amplitude),
  );
}

describe("gaitProtocol", () => {
  test("uses a 25 second target with a 20 to 30 second accepted window", () => {
    expect(gaitProtocol.targetDurationSeconds).toBe(25);
    expect(gaitProtocol.minDurationSeconds).toBe(20);
    expect(gaitProtocol.maxDurationSeconds).toBe(30);
  });
});

describe("validMotionSamples", () => {
  test("drops non-finite samples and sorts by timestamp", () => {
    const validLate = sampleAt(2);
    const validEarly = sampleAt(1);
    const invalid = {
      ...sampleAt(3),
      accelerationX: Number.NaN,
    };

    expect(validMotionSamples([validLate, invalid, validEarly])).toEqual([
      validEarly,
      validLate,
    ]);
  });
});

describe("validateGaitCapture", () => {
  test("accepts a normal 25 second active walk", () => {
    const result = validateGaitCapture({
      durationSeconds: 25,
      samples: walkingSamples(25),
    });

    expect(result.usable).toBe(true);
    expect(result.issue).toBe("ok");
    expect(result.sampleRateHz).toBeGreaterThanOrEqual(45);
  });

  test("rejects active walks shorter than 20 seconds", () => {
    const result = validateGaitCapture({
      durationSeconds: 19.9,
      samples: walkingSamples(19.9),
    });

    expect(result.usable).toBe(false);
    expect(result.issue).toBe("duration_too_short");
  });

  test("rejects active walks longer than 30 seconds", () => {
    const result = validateGaitCapture({
      durationSeconds: 30.5,
      samples: walkingSamples(30.5),
    });

    expect(result.usable).toBe(false);
    expect(result.issue).toBe("duration_too_long");
  });

  test("rejects low sample-rate captures", () => {
    const result = validateGaitCapture({
      durationSeconds: 25,
      samples: walkingSamples(25, 10),
    });

    expect(result.usable).toBe(false);
    expect(result.issue).toBe("low_sample_rate");
  });

  test("rejects static samples", () => {
    const staticSamples = walkingSamples(25).map((sample) => ({
      ...sample,
      accelerationX: 0,
      accelerationY: 0,
      accelerationZ: 9.81,
      rotationAlpha: 0,
      rotationBeta: 0,
      rotationGamma: 0,
    }));

    const result = validateGaitCapture({
      durationSeconds: 25,
      samples: staticSamples,
    });

    expect(result.usable).toBe(false);
    expect(result.issue).toBe("static_signal");
  });
});
