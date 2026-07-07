import { describe, expect, test } from "bun:test";
import { motionSampleFromDeviceMotionEvent } from "../../src/lib/sensors/browser-motion";

describe("motionSampleFromDeviceMotionEvent", () => {
  test("uses accelerationIncludingGravity and rotationRate", () => {
    const sample = motionSampleFromDeviceMotionEvent(
      {
        acceleration: { x: 99, y: 99, z: 99 },
        accelerationIncludingGravity: { x: 1.1, y: -2.2, z: 9.7 },
        rotationRate: { alpha: 3, beta: -4, gamma: 5 },
      } as DeviceMotionEvent,
      1234,
    );

    expect(sample).toEqual({
      timestampMs: 1234,
      accelerationX: 1.1,
      accelerationY: -2.2,
      accelerationZ: 9.7,
      rotationAlpha: 3,
      rotationBeta: -4,
      rotationGamma: 5,
    });
  });

  test("returns null instead of falling back to acceleration", () => {
    const sample = motionSampleFromDeviceMotionEvent(
      {
        acceleration: { x: 1, y: 2, z: 3 },
        accelerationIncludingGravity: null,
        rotationRate: { alpha: 3, beta: 4, gamma: 5 },
      } as DeviceMotionEvent,
      2000,
    );

    expect(sample).toBeNull();
  });

  test("keeps samples usable when rotationRate is absent", () => {
    const sample = motionSampleFromDeviceMotionEvent(
      {
        acceleration: null,
        accelerationIncludingGravity: { x: 0, y: 9.81, z: 0 },
        rotationRate: null,
      } as DeviceMotionEvent,
      3000,
    );

    expect(sample).toEqual({
      timestampMs: 3000,
      accelerationX: 0,
      accelerationY: 9.81,
      accelerationZ: 0,
      rotationAlpha: undefined,
      rotationBeta: undefined,
      rotationGamma: undefined,
    });
  });
});
