import { describe, expect, test } from "bun:test";
import { aggregateCycles } from "../../src/lib/sensors/gait-reconstruction/aggregate";
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
