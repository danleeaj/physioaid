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
  test("uses a 15 second target with a 12 to 18 second accepted window", () => {
    expect(gaitProtocol.targetDurationSeconds).toBe(15);
    expect(gaitProtocol.minDurationSeconds).toBe(12);
    expect(gaitProtocol.maxDurationSeconds).toBe(18);
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
  test("accepts a normal 15 second active walk", () => {
    const result = validateGaitCapture({
      durationSeconds: 15,
      samples: walkingSamples(15),
    });

    expect(result.usable).toBe(true);
    expect(result.issue).toBe("ok");
    expect(result.sampleRateHz).toBeGreaterThanOrEqual(45);
  });

  test("rejects active walks shorter than 12 seconds", () => {
    const result = validateGaitCapture({
      durationSeconds: 11.9,
      samples: walkingSamples(11.9),
    });

    expect(result.usable).toBe(false);
    expect(result.issue).toBe("duration_too_short");
  });

  test("rejects active walks longer than 18 seconds", () => {
    const result = validateGaitCapture({
      durationSeconds: 18.5,
      samples: walkingSamples(18.5),
    });

    expect(result.usable).toBe(false);
    expect(result.issue).toBe("duration_too_long");
  });

  test("rejects low sample-rate captures", () => {
    const result = validateGaitCapture({
      durationSeconds: 15,
      samples: walkingSamples(15, 19),
    });

    expect(result.usable).toBe(false);
    expect(result.issue).toBe("low_sample_rate");
  });

  test("rejects static samples", () => {
    const staticSamples = walkingSamples(15).map((sample) => ({
      ...sample,
      accelerationX: 0,
      accelerationY: 0,
      accelerationZ: 9.81,
      rotationAlpha: 0,
      rotationBeta: 0,
      rotationGamma: 0,
    }));

    const result = validateGaitCapture({
      durationSeconds: 15,
      samples: staticSamples,
    });

    expect(result.usable).toBe(false);
    expect(result.issue).toBe("static_signal");
  });
});
