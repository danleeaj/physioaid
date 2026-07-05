import { describe, expect, test } from "bun:test";
import {
  getMotionSensorSupport,
  toMotionReading,
  toOrientationReading,
} from "../../src/lib/sensors/accelerometer";

describe("getMotionSensorSupport", () => {
  test("detects motion and orientation APIs with iOS-style permission methods", () => {
    function DeviceMotionEvent() {}
    Object.assign(DeviceMotionEvent, {
      requestPermission: () => Promise.resolve("granted"),
    });

    function DeviceOrientationEvent() {}
    Object.assign(DeviceOrientationEvent, {
      requestPermission: () => Promise.resolve("granted"),
    });

    expect(
      getMotionSensorSupport({
        DeviceMotionEvent,
        DeviceOrientationEvent,
        isSecureContext: true,
        navigator: { userAgent: "Mobile Safari" },
      }),
    ).toEqual({
      hasDeviceMotion: true,
      hasDeviceOrientation: true,
      requiresMotionPermission: true,
      requiresOrientationPermission: true,
      isSecureContext: true,
      userAgent: "Mobile Safari",
    });
  });

  test("reports unsupported APIs without throwing", () => {
    expect(getMotionSensorSupport({ isSecureContext: false })).toEqual({
      hasDeviceMotion: false,
      hasDeviceOrientation: false,
      requiresMotionPermission: false,
      requiresOrientationPermission: false,
      isSecureContext: false,
      userAgent: "Unavailable",
    });
  });
});

describe("toMotionReading", () => {
  test("copies every DeviceMotion numeric field into a plain object", () => {
    const event = {
      acceleration: { x: 1.1, y: -2.2, z: 3.3 },
      accelerationIncludingGravity: { x: 4.4, y: 5.5, z: -6.6 },
      rotationRate: { alpha: 7.7, beta: -8.8, gamma: 9.9 },
      interval: 16,
    } as DeviceMotionEvent;

    expect(toMotionReading(event, "2026-07-04T00:00:00.000Z")).toEqual({
      acceleration: { x: 1.1, y: -2.2, z: 3.3 },
      accelerationIncludingGravity: { x: 4.4, y: 5.5, z: -6.6 },
      rotationRate: { alpha: 7.7, beta: -8.8, gamma: 9.9 },
      interval: 16,
      capturedAt: "2026-07-04T00:00:00.000Z",
    });
  });

  test("uses null for missing DeviceMotion vectors and values", () => {
    const event = {
      acceleration: null,
      accelerationIncludingGravity: { x: undefined, y: 0, z: null },
      rotationRate: null,
      interval: null,
    } as DeviceMotionEvent;

    expect(toMotionReading(event, "2026-07-04T00:00:00.000Z")).toEqual({
      acceleration: { x: null, y: null, z: null },
      accelerationIncludingGravity: { x: null, y: 0, z: null },
      rotationRate: { alpha: null, beta: null, gamma: null },
      interval: null,
      capturedAt: "2026-07-04T00:00:00.000Z",
    });
  });
});

describe("toOrientationReading", () => {
  test("copies every DeviceOrientation field into a plain object", () => {
    const event = {
      alpha: 10,
      beta: -20,
      gamma: 30,
      absolute: true,
    } as DeviceOrientationEvent;

    expect(toOrientationReading(event, "2026-07-04T00:00:00.000Z")).toEqual({
      alpha: 10,
      beta: -20,
      gamma: 30,
      absolute: true,
      capturedAt: "2026-07-04T00:00:00.000Z",
    });
  });
});
