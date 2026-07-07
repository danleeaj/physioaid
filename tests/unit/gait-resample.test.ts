import { describe, expect, test } from "bun:test";
import { resampleGaitSeries } from "../../src/lib/sensors/gait-reconstruction/resample";
import type { MotionSample } from "../../src/types/motion";

function sample(
  timestampMs: number,
  accelerationX: number,
  rotationAlpha?: number,
): MotionSample {
  return {
    timestampMs,
    accelerationX,
    accelerationY: accelerationX + 10,
    accelerationZ: accelerationX + 20,
    rotationAlpha,
    rotationBeta: rotationAlpha === undefined ? undefined : rotationAlpha + 10,
    rotationGamma: rotationAlpha === undefined ? undefined : rotationAlpha + 20,
  };
}

describe("resampleGaitSeries", () => {
  test("interpolates irregular samples onto a 50 Hz grid", () => {
    const series = resampleGaitSeries([
      sample(0, 0),
      sample(30, 30),
      sample(70, 70),
      sample(100, 100),
    ]);

    expect(series.fs).toBe(50);
    expect(series.n).toBe(6);
    expect(Array.from(series.accel.slice(0, 6))).toEqual([
      0, 10, 20, 20, 30, 40,
    ]);
    expect(series.gyro).toBeNull();
  });

  test("converts gyro degrees per second to radians per second in device axis order", () => {
    const series = resampleGaitSeries([
      sample(0, 0, 90),
      sample(20, 20, 180),
      sample(40, 40, 270),
    ]);

    expect(series.gyro).not.toBeNull();
    expect(series.gyro![0]).toBeCloseTo((100 * Math.PI) / 180, 8);
    expect(series.gyro![1]).toBeCloseTo((110 * Math.PI) / 180, 8);
    expect(series.gyro![2]).toBeCloseTo((90 * Math.PI) / 180, 8);
  });

  test("treats partial rotationRate as reduced mode", () => {
    const series = resampleGaitSeries([
      { ...sample(0, 0, 90), rotationGamma: undefined },
      { ...sample(20, 20, 120), rotationGamma: undefined },
    ]);

    expect(series.gyro).toBeNull();
  });
});
