import { describe, expect, test } from "bun:test";
import { aggregateCycles } from "../../src/lib/sensors/gait-reconstruction/aggregate";
import { analyzeGaitReconstruction } from "../../src/lib/sensors/gait-reconstruction/analyze";
import { cycleAttitude } from "../../src/lib/sensors/gait-reconstruction/attitude";
import { calibrateHeading } from "../../src/lib/sensors/gait-reconstruction/heading";
import { reconstructCycle } from "../../src/lib/sensors/gait-reconstruction/reconstruct";
import { resampleGaitSeries } from "../../src/lib/sensors/gait-reconstruction/resample";
import { segmentGaitCycles } from "../../src/lib/sensors/gait-reconstruction/segment";
import { syntheticClosedLoopGait } from "./helpers/synthetic-gait";

describe("gait reconstruction primitives", () => {
  test("reconstructs a closed synthetic gait loop without inflated vertical motion", () => {
    const series = resampleGaitSeries(syntheticClosedLoopGait());
    const peaks = segmentGaitCycles(series);
    const cycles = peaks
      .slice(0, Math.min(8, peaks.length - 1))
      .map((peak, index) => {
        const next = peaks[index + 1];
        const attitude = cycleAttitude(series, peak, next);
        return calibrateHeading(
          reconstructCycle(series, attitude, peak, next),
        );
      });
    const canonical = aggregateCycles(cycles);

    expect(cycles.length).toBeGreaterThanOrEqual(5);
    expect(range(canonical.disp, 1)).toBeGreaterThan(0.035);
    expect(range(canonical.disp, 1)).toBeLessThan(0.12);
    expect(range(canonical.disp, 0)).toBeGreaterThan(0.35);
    expect(range(canonical.disp, 2)).toBeGreaterThan(0.015);
  });
});

function range(values: Float64Array, axis: 0 | 1 | 2) {
  const axisValues: number[] = [];
  for (let i = axis; i < values.length; i += 3) axisValues.push(values[i]);
  return Math.max(...axisValues) - Math.min(...axisValues);
}

describe("analyzeGaitReconstruction", () => {
  test("returns full reconstruction metrics for gyro-capable samples", () => {
    const result = analyzeGaitReconstruction({
      durationSeconds: 18,
      samples: syntheticClosedLoopGait({
        cycleSeconds: 0.9,
        includeGyro: true,
        seconds: 18,
      }),
      stepLengthMeters: 0.68,
    });

    expect(result.completionStatus).toBe("completed");
    expect(result.mode).toBe("full");
    expect(result.cycleCount).toBeGreaterThanOrEqual(5);
    expect(result.cadenceStepsPerMinute).toBeGreaterThan(90);
    expect(result.cadenceStepsPerMinute).toBeLessThan(130);
    expect(result.shape.verticalExcursionM).toBeGreaterThan(0.035);
    expect(result.shape.forwardExcursionM).toBeGreaterThan(0.35);
    expect(result.absoluteEstimateMethod).toBe("height_regression");
  });

  test("returns reduced metrics when gyro is absent", () => {
    const result = analyzeGaitReconstruction({
      durationSeconds: 15,
      samples: syntheticClosedLoopGait({ includeGyro: false, seconds: 15 }),
      stepLengthMeters: 0.68,
    });

    expect(result.completionStatus).toBe("completed");
    expect(result.mode).toBe("reduced");
    expect(result.shape.verticalExcursionM).toBeGreaterThan(0.035);
    expect(result.shape.forwardExcursionM).toBeUndefined();
    expect(result.shape.symmetry).toBeUndefined();
  });

  test("fails closed for static captures", () => {
    const samples = syntheticClosedLoopGait({ seconds: 15 }).map((sample) => ({
      ...sample,
      accelerationX: 0,
      accelerationY: 9.81,
      accelerationZ: 0,
      rotationAlpha: 0,
      rotationBeta: 0,
      rotationGamma: 0,
    }));

    const result = analyzeGaitReconstruction({
      durationSeconds: 15,
      samples,
      stepLengthMeters: 0.68,
    });

    expect(result.completionStatus).toBe("stopped");
    expect(result.mode).toBe("heuristic");
    expect(result.quality).toBe(0);
  });
});
