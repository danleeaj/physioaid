import { describe, expect, test } from "bun:test";
import { resampleGaitSeries } from "../../src/lib/sensors/gait-reconstruction/resample";
import { segmentGaitCycles } from "../../src/lib/sensors/gait-reconstruction/segment";
import type { MotionSample } from "../../src/types/motion";

function signedStrideSamples(
  seconds = 25,
  fs = 50,
  cycleSeconds = 1.1,
): MotionSample[] {
  return Array.from({ length: Math.floor(seconds * fs) }, (_, index) => {
    const t = index / fs;
    const phase = (2 * Math.PI * t) / cycleSeconds;
    return {
      timestampMs: t * 1000,
      accelerationX: Math.sin(phase) * 0.9,
      accelerationY: 9.81 + Math.cos(phase) * 0.35,
      accelerationZ: Math.sin(phase + Math.PI / 3) * 0.25,
      rotationAlpha: Math.sin(phase) * 12,
      rotationBeta: Math.cos(phase) * 8,
      rotationGamma: Math.sin(phase + Math.PI / 5) * 5,
    };
  });
}

describe("segmentGaitCycles", () => {
  test("finds repeated signed gait cycles", () => {
    const series = resampleGaitSeries(signedStrideSamples());
    const peaks = segmentGaitCycles(series);
    const intervals = peaks
      .slice(1)
      .map((peak, index) => (peak - peaks[index]) / series.fs);

    expect(peaks.length).toBeGreaterThanOrEqual(15);
    expect(median(intervals)).toBeGreaterThan(0.9);
    expect(median(intervals)).toBeLessThan(1.3);
  });

  test("does not return cycles for static data", () => {
    const samples = Array.from({ length: 25 * 50 }, (_, index) => ({
      timestampMs: index * 20,
      accelerationX: 0,
      accelerationY: 9.81,
      accelerationZ: 0,
      rotationAlpha: 0,
      rotationBeta: 0,
      rotationGamma: 0,
    }));
    const series = resampleGaitSeries(samples);

    expect(() => segmentGaitCycles(series)).toThrow(
      "No repetitive gait pattern",
    );
  });
});

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
