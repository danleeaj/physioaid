import { describe, expect, test } from "bun:test";
import { createStandstillAutoStopDetector } from "../../src/lib/sensors/standstill-auto-stop";
import type { MotionSample } from "../../src/types/motion";

function stillSample(timestampMs: number): MotionSample {
  return {
    timestampMs,
    accelerationX: 0.01 * Math.sin(timestampMs / 100),
    accelerationY: 0,
    accelerationZ: 9.81 + 0.01 * Math.cos(timestampMs / 100),
    rotationAlpha: 0,
    rotationBeta: 0,
    rotationGamma: 0,
  };
}

function walkingSample(timestampMs: number): MotionSample {
  const phase = (2 * Math.PI * timestampMs) / 550;
  return {
    timestampMs,
    accelerationX: Math.sin(phase) * 0.55,
    accelerationY: Math.cos(phase) * 0.25,
    accelerationZ: 9.81 + Math.sin(phase) * 1.1,
    rotationAlpha: Math.sin(phase) * 8,
    rotationBeta: Math.cos(phase) * 5,
    rotationGamma: Math.sin(phase) * 3,
  };
}

describe("createStandstillAutoStopDetector", () => {
  test("ignores initial standstill before walking begins", () => {
    const stoppedAt: number[] = [];
    const detector = createStandstillAutoStopDetector({
      requiredStillMs: 3000,
      onStandstill: (sample) => stoppedAt.push(sample.timestampMs),
    });

    for (let timestampMs = 0; timestampMs <= 5000; timestampMs += 100) {
      detector.addSample(stillSample(timestampMs));
    }

    expect(stoppedAt).toEqual([]);
  });

  test("fires once after walking is followed by three seconds of stillness", () => {
    const stoppedAt: number[] = [];
    const detector = createStandstillAutoStopDetector({
      requiredStillMs: 3000,
      onStandstill: (sample) => stoppedAt.push(sample.timestampMs),
    });

    for (let timestampMs = 0; timestampMs <= 1200; timestampMs += 100) {
      detector.addSample(stillSample(timestampMs));
    }
    for (let timestampMs = 1300; timestampMs <= 5200; timestampMs += 100) {
      detector.addSample(walkingSample(timestampMs));
    }
    for (let timestampMs = 5300; timestampMs <= 9000; timestampMs += 100) {
      detector.addSample(stillSample(timestampMs));
    }

    expect(stoppedAt).toHaveLength(1);
    expect(stoppedAt[0]).toBeGreaterThanOrEqual(8000);

    detector.addSample(stillSample(9100));
    expect(stoppedAt).toHaveLength(1);
  });
});
