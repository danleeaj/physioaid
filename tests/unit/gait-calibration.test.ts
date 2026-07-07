import { describe, expect, test } from "bun:test";
import {
  analyzeGaitCalibration,
  nextSessionCalibration,
  type GaitSessionCalibration,
} from "../../src/lib/sensors/gait-calibration";
import type { MotionSample } from "../../src/types/motion";

function calibrationWalk(options?: {
  hz?: number;
  walkSeconds?: number;
  standSeconds?: number;
  tailSeconds?: number;
  stepHz?: number;
}): MotionSample[] {
  const hz = options?.hz ?? 50;
  const walkSeconds = options?.walkSeconds ?? 6.8;
  const standSeconds = options?.standSeconds ?? 3;
  const tailSeconds = options?.tailSeconds ?? 2;
  const stepHz = options?.stepHz ?? 1.8;
  const samples: MotionSample[] = [];

  for (let index = 0; index < Math.floor(walkSeconds * hz); index += 1) {
    const t = index / hz;
    const phase = 2 * Math.PI * stepHz * t;
    samples.push({
      timestampMs: t * 1000,
      accelerationX: Math.sin(phase) * 0.55,
      accelerationY: Math.cos(phase) * 0.25,
      accelerationZ: 9.81 + Math.sin(phase) * 1.1,
      rotationAlpha: Math.sin(phase) * 8,
      rotationBeta: Math.cos(phase) * 5,
      rotationGamma: Math.sin(phase) * 3,
    });
  }

  const standStartSeconds = walkSeconds;
  for (let index = 0; index < Math.floor(standSeconds * hz); index += 1) {
    const t = standStartSeconds + index / hz;
    samples.push({
      timestampMs: t * 1000,
      accelerationX: 0.01 * Math.sin(index),
      accelerationY: 0,
      accelerationZ: 9.81 + 0.01 * Math.cos(index),
      rotationAlpha: 0,
      rotationBeta: 0,
      rotationGamma: 0,
    });
  }

  const tailStartSeconds = walkSeconds + standSeconds;
  for (let index = 0; index < Math.floor(tailSeconds * hz); index += 1) {
    const t = tailStartSeconds + index / hz;
    const phase = 2 * Math.PI * 6 * (index / hz);
    samples.push({
      timestampMs: t * 1000,
      accelerationX: Math.sin(phase) * 2.2,
      accelerationY: Math.cos(phase) * 1.7,
      accelerationZ: 9.81 + Math.sin(phase) * 2.4,
      rotationAlpha: Math.sin(phase) * 80,
      rotationBeta: Math.cos(phase) * 70,
      rotationGamma: Math.sin(phase) * 60,
    });
  }

  return samples;
}

const fixedNow = () => new Date("2026-07-07T00:00:00.000Z");

describe("analyzeGaitCalibration", () => {
  test("rejects distances outside the supported range", () => {
    const samples = calibrationWalk();

    expect(
      analyzeGaitCalibration({
        samples,
        enteredDistanceMeters: 2.9,
        elapsedSeconds: 12,
        now: fixedNow,
      }),
    ).toEqual({ status: "rejected", reason: "invalid_distance" });

    expect(
      analyzeGaitCalibration({
        samples,
        enteredDistanceMeters: 20.1,
        elapsedSeconds: 12,
        now: fixedNow,
      }),
    ).toEqual({ status: "rejected", reason: "invalid_distance" });
  });

  test("accepts a clean walk and trims phone-removal tail", () => {
    const samples = calibrationWalk({
      walkSeconds: 6.8,
      standSeconds: 3,
      tailSeconds: 2,
    });
    const result = analyzeGaitCalibration({
      samples,
      enteredDistanceMeters: 6,
      elapsedSeconds: 11.8,
      now: fixedNow,
    });

    expect(result.status).toBe("accepted");
    if (result.status !== "accepted") return;

    const lastSampleMs = samples.at(-1)?.timestampMs ?? 0;
    expect(result.walkingSegment.endMs).toBeLessThan(lastSampleMs - 1200);
    expect(result.calibration.calibratedStepLengthMeters).toBeGreaterThan(0.25);
    expect(result.calibration.calibratedStepLengthMeters).toBeLessThan(1.2);
    expect(result.calibration.calibrationDistanceMeters).toBe(6);
    expect(result.calibration.calibrationWalkDurationSeconds).toBeLessThan(8.5);
    expect(result.calibration.calibrationStepCount).toBeGreaterThanOrEqual(8);
    expect(result.calibration.calibrationQualityScore).toBeGreaterThanOrEqual(
      0.55,
    );
    expect(result.calibration.calibratedAt).toBe(
      "2026-07-07T00:00:00.000Z",
    );
  });

  test("rejects captures without a clean standstill finish", () => {
    const result = analyzeGaitCalibration({
      samples: calibrationWalk({
        walkSeconds: 6.8,
        standSeconds: 0,
        tailSeconds: 2,
      }),
      enteredDistanceMeters: 6,
      elapsedSeconds: 8.8,
      now: fixedNow,
    });

    expect(result).toEqual({
      status: "rejected",
      reason: "no_clean_finish",
    });
  });

  test("rejects implausible calibrated step length", () => {
    const result = analyzeGaitCalibration({
      samples: calibrationWalk({
        walkSeconds: 9.5,
        standSeconds: 3,
        tailSeconds: 0,
        stepHz: 2,
      }),
      enteredDistanceMeters: 3,
      elapsedSeconds: 12.5,
      now: fixedNow,
    });

    expect(result).toEqual({
      status: "rejected",
      reason: "implausible_step_length",
    });
  });
});

describe("nextSessionCalibration", () => {
  test("keeps the current session calibration after rejected retry", () => {
    const current: GaitSessionCalibration = {
      calibratedStepLengthMeters: 0.62,
      calibrationDistanceMeters: 6,
      calibrationWalkDurationSeconds: 7.1,
      calibrationStepCount: 10,
      calibrationQualityScore: 0.84,
      calibratedAt: "2026-07-07T00:00:00.000Z",
    };

    expect(
      nextSessionCalibration(current, {
        status: "rejected",
        reason: "low_quality",
      }),
    ).toBe(current);
  });
});
