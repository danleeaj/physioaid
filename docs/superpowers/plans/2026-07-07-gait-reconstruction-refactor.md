# Gait Reconstruction Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-only gait reconstruction analysis core that runs behind the existing motion summary boundary and preserves the current safety-gated assessment flow.

**Architecture:** Add an internal `src/lib/sensors/gait-reconstruction/` module set for resampling, signed correlation segmentation, gravity-anchored attitude, closed reconstruction, heading calibration, aggregation, and parameter assembly. Keep `summarizeMotionSamples()` as the app boundary, keep the current magnitude step detector as QC/fallback, and map results into lightly extended `MotionMetrics`.

**Tech Stack:** TypeScript, Bun test runner, Next.js app code, `gl-matrix` for quaternion/vector/matrix math.

---

## File Structure

Create:

- `src/lib/sensors/gait-reconstruction/types.ts`  
  Internal reconstruction types and result shape.
- `src/lib/sensors/gait-reconstruction/resample.ts`  
  Converts irregular `MotionSample[]` into a 50 Hz `UniformSeries`.
- `src/lib/sensors/gait-reconstruction/segment.ts`  
  Signed-channel correlation segmentation and peak utilities.
- `src/lib/sensors/gait-reconstruction/attitude.ts`  
  Gravity-anchored gyro attitude shim using `gl-matrix`.
- `src/lib/sensors/gait-reconstruction/reconstruct.ts`  
  World-frame closed double integration and phase resampling.
- `src/lib/sensors/gait-reconstruction/heading.ts`  
  PCA heading calibration on horizontal displacement.
- `src/lib/sensors/gait-reconstruction/aggregate.ts`  
  Cross-cycle canonical representation.
- `src/lib/sensors/gait-reconstruction/parameters.ts`  
  Cycle timing, shape metrics, step/stride disambiguation, and absolute estimate labels.
- `src/lib/sensors/gait-reconstruction/analyze.ts`  
  Orchestrates reconstruction and exposes a summary suitable for `motion-summary.ts`.
- `tests/unit/helpers/synthetic-gait.ts`  
  Deterministic gait fixtures for full and reduced mode tests.
- `tests/unit/browser-motion.test.ts`  
  Capture helper tests.
- `tests/unit/gait-resample.test.ts`  
  Resampling tests.
- `tests/unit/gait-segment.test.ts`  
  Correlation segmentation tests.
- `tests/unit/gait-reconstruction.test.ts`  
  Reconstruction and parameter tests.

Modify:

- `package.json`
- `package-lock.json`
- `src/types/assessment.ts`
- `src/lib/sensors/browser-motion.ts`
- `src/lib/sensors/motion-summary.ts`
- `src/components/assessment/screens/GaitScreen.tsx`
- Existing `tests/unit/motion-summary.test.ts`
- Existing `tests/unit/gait-metrics.test.ts` only if expectations need estimate labels
- Existing `tests/unit/direct-gait-flow.test.ts` only if expectations need estimate labels

Do not modify:

- `src/lib/vision/**`
- `src/lib/functional-tests/gates.ts`
- `src/config/**`
- `src/content/**`
- clinical recommendation copy

---

## Task 1: Dependency, Contract, And Capture Helper

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/types/assessment.ts`
- Modify: `src/lib/sensors/browser-motion.ts`
- Create: `tests/unit/browser-motion.test.ts`

- [ ] **Step 1: Install the approved production dependency**

Run:

```bash
bun add gl-matrix
npm install --package-lock-only --ignore-scripts
```

Expected:

- `package.json` contains `"gl-matrix"` in `dependencies`.
- `package-lock.json` contains a `node_modules/gl-matrix` entry.
- If Bun creates `bun.lock`, include it in the commit because the repo preference is Bun for dependency work.

- [ ] **Step 2: Write the failing capture helper tests**

Create `tests/unit/browser-motion.test.ts`:

```ts
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
```

- [ ] **Step 3: Run the new test and verify it fails**

Run:

```bash
bun test tests/unit/browser-motion.test.ts
```

Expected:

- FAIL because `motionSampleFromDeviceMotionEvent` is not exported.

- [ ] **Step 4: Add optional `MotionMetrics` fields**

Modify `src/types/assessment.ts` by extending `MotionMetrics`:

```ts
export type MotionMetrics = {
  stabilityScore: number;
  rhythmConsistency: number;
  gaitSpeedMetersPerSecond?: number;
  estimatedGaitSpeedMetersPerSecond?: number;
  gaitSpeedEstimateSource?: "course_distance" | "estimated_step_length";
  analysisMode?: "heuristic" | "reconstruction_full" | "reconstruction_reduced";
  absoluteEstimateMethod?: "height_regression" | "course_distance" | "none";
  trajectoryShape?: {
    verticalExcursionM?: number;
    forwardExcursionM?: number;
    lateralSwayM?: number;
    pathLengthM?: number;
    symmetry?: number;
  };
  stepCount?: number;
  cadenceStepsPerMinute?: number;
  stepTimeMeanSeconds?: number;
  stepTimeVariability?: number;
  jerkVariability?: number;
  rotationVariability?: number;
  cycleQualityScore?: number;
  completionStatus?: "completed" | "stopped" | "skipped" | "demo";
  source: "accelerometer" | "manual" | "demo";
};
```

- [ ] **Step 5: Export the capture helper and use it in live capture**

Modify `src/lib/sensors/browser-motion.ts`.

Add this exported helper above `startMotionCapture`:

```ts
export function motionSampleFromDeviceMotionEvent(
  event: DeviceMotionEvent,
  timestampMs: number,
): MotionSample | null {
  const acceleration = toFiniteVector(event.accelerationIncludingGravity);

  if (!acceleration) {
    return null;
  }

  return {
    timestampMs,
    accelerationX: acceleration.x,
    accelerationY: acceleration.y,
    accelerationZ: acceleration.z,
    rotationAlpha: toFiniteNumber(event.rotationRate?.alpha) ?? undefined,
    rotationBeta: toFiniteNumber(event.rotationRate?.beta) ?? undefined,
    rotationGamma: toFiniteNumber(event.rotationRate?.gamma) ?? undefined,
  };
}
```

Replace the body of `handleMotion` inside `startMotionCapture`:

```ts
  const handleMotion = (event: DeviceMotionEvent) => {
    const sample = motionSampleFromDeviceMotionEvent(event, performance.now());

    if (!sample) {
      return;
    }

    onSample(sample);
  };
```

- [ ] **Step 6: Verify capture helper tests pass**

Run:

```bash
bun test tests/unit/browser-motion.test.ts
```

Expected:

- PASS, 3 tests.

- [ ] **Step 7: Commit Task 1**

Run:

```bash
git add package.json package-lock.json bun.lock src/types/assessment.ts src/lib/sensors/browser-motion.ts tests/unit/browser-motion.test.ts
git commit -m "feat(gait): add reconstruction dependency and capture contract"
```

If `bun.lock` does not exist, run the same command without `bun.lock`.

---

## Task 2: Uniform Resampling

**Files:**

- Create: `src/lib/sensors/gait-reconstruction/types.ts`
- Create: `src/lib/sensors/gait-reconstruction/resample.ts`
- Create: `tests/unit/gait-resample.test.ts`

- [ ] **Step 1: Write the failing resampling tests**

Create `tests/unit/gait-resample.test.ts`:

```ts
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
    expect(Array.from(series.accel.slice(0, 6))).toEqual([0, 10, 20, 20, 30, 40]);
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
```

- [ ] **Step 2: Run the resampling tests and verify they fail**

Run:

```bash
bun test tests/unit/gait-resample.test.ts
```

Expected:

- FAIL because `gait-reconstruction/resample` does not exist.

- [ ] **Step 3: Create reconstruction types**

Create `src/lib/sensors/gait-reconstruction/types.ts`:

```ts
export type UniformSeries = {
  fs: number;
  accel: Float64Array;
  gyro: Float64Array | null;
  n: number;
};

export type CycleRepresentation = {
  disp: Float64Array;
  ori: Float64Array;
};

export type TrajectoryShape = {
  verticalExcursionM?: number;
  forwardExcursionM?: number;
  lateralSwayM?: number;
  pathLengthM?: number;
  symmetry?: number;
};

export type GaitReconstructionResult = {
  completionStatus: "completed" | "stopped";
  mode: "full" | "reduced" | "heuristic";
  cycleCount: number;
  cycleTimeS?: number;
  cycleTimeVariabilityS?: number;
  cadenceStepsPerMinute?: number;
  stepsPerCycle?: 1 | 2;
  canonical: CycleRepresentation | null;
  perCycle: CycleRepresentation[];
  shape: TrajectoryShape;
  quality: number;
  failureReason?: string;
};
```

- [ ] **Step 4: Implement resampling**

Create `src/lib/sensors/gait-reconstruction/resample.ts`:

```ts
import type { MotionSample } from "@/types/motion";
import type { UniformSeries } from "@/lib/sensors/gait-reconstruction/types";

export const TARGET_GAIT_FS = 50;

export function resampleGaitSeries(
  samples: MotionSample[],
  targetFs = TARGET_GAIT_FS,
): UniformSeries {
  if (samples.length === 0) {
    return { fs: targetFs, accel: new Float64Array(0), gyro: null, n: 0 };
  }

  const sorted = [...samples].sort((a, b) => a.timestampMs - b.timestampMs);
  const t0 = sorted[0].timestampMs;
  const t1 = sorted[sorted.length - 1].timestampMs;
  const durationSeconds = Math.max(0, (t1 - t0) / 1000);
  const n = Math.floor(durationSeconds * targetFs) + 1;
  const accel = new Float64Array(n * 3);
  const hasGyro = sorted.every(
    (sample) =>
      sample.rotationAlpha !== undefined &&
      sample.rotationBeta !== undefined &&
      sample.rotationGamma !== undefined,
  );
  const gyro = hasGyro ? new Float64Array(n * 3) : null;
  const degToRad = Math.PI / 180;

  let j = 0;
  for (let i = 0; i < n; i += 1) {
    const t = t0 + (i / targetFs) * 1000;
    while (j < sorted.length - 2 && sorted[j + 1].timestampMs < t) {
      j += 1;
    }

    const a = sorted[j];
    const b = sorted[j + 1] ?? sorted[j];
    const span = b.timestampMs - a.timestampMs || 1;
    const weight = Math.min(1, Math.max(0, (t - a.timestampMs) / span));
    const base = i * 3;

    accel[base] = lerp(a.accelerationX, b.accelerationX, weight);
    accel[base + 1] = lerp(a.accelerationY, b.accelerationY, weight);
    accel[base + 2] = lerp(a.accelerationZ, b.accelerationZ, weight);

    if (gyro) {
      gyro[base] = lerp(a.rotationBeta!, b.rotationBeta!, weight) * degToRad;
      gyro[base + 1] =
        lerp(a.rotationGamma!, b.rotationGamma!, weight) * degToRad;
      gyro[base + 2] =
        lerp(a.rotationAlpha!, b.rotationAlpha!, weight) * degToRad;
    }
  }

  return { fs: targetFs, accel, gyro, n };
}

function lerp(a: number, b: number, weight: number) {
  return a + weight * (b - a);
}
```

- [ ] **Step 5: Verify resampling tests pass**

Run:

```bash
bun test tests/unit/gait-resample.test.ts
```

Expected:

- PASS, 3 tests.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add src/lib/sensors/gait-reconstruction/types.ts src/lib/sensors/gait-reconstruction/resample.ts tests/unit/gait-resample.test.ts
git commit -m "feat(gait): resample motion samples for reconstruction"
```

---

## Task 3: Signed Correlation Segmentation

**Files:**

- Create: `src/lib/sensors/gait-reconstruction/segment.ts`
- Create: `tests/unit/gait-segment.test.ts`

- [ ] **Step 1: Write the failing segmentation tests**

Create `tests/unit/gait-segment.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { segmentGaitCycles } from "../../src/lib/sensors/gait-reconstruction/segment";
import { resampleGaitSeries } from "../../src/lib/sensors/gait-reconstruction/resample";
import type { MotionSample } from "../../src/types/motion";

function signedStrideSamples(seconds = 25, fs = 50, cycleSeconds = 1.1): MotionSample[] {
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
    const intervals = peaks.slice(1).map((peak, index) => (peak - peaks[index]) / series.fs);

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

    expect(() => segmentGaitCycles(series)).toThrow("No repetitive gait pattern");
  });
});

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
```

- [ ] **Step 2: Run the segmentation tests and verify they fail**

Run:

```bash
bun test tests/unit/gait-segment.test.ts
```

Expected:

- FAIL because `segmentGaitCycles` is missing.

- [ ] **Step 3: Implement signed-channel segmentation**

Create `src/lib/sensors/gait-reconstruction/segment.ts` with these exports:

```ts
import type { UniformSeries } from "@/lib/sensors/gait-reconstruction/types";

const CORRELATION_THRESHOLD = 0.5;
const MIN_REPETITIONS = 3;

export function segmentGaitCycles(series: UniformSeries): number[] {
  const { fs, n } = series;
  const channels = series.gyro ? 6 : 3;
  const signal = buildSignedChannels(series);
  const templateLength = Math.round(2 * fs);
  const templateStep = Math.round(4 * fs);
  const minPeakDistance = Math.round(0.4 * fs);

  let best: { score: number; peaks: number[] } | null = null;

  for (let start = 0; start + templateLength < n; start += templateStep) {
    const corr = slidingCorr(signal, channels, n, start, templateLength);
    const peaks = findPeaks(corr, CORRELATION_THRESHOLD, minPeakDistance);
    if (peaks.length < MIN_REPETITIONS) continue;

    const intervals = diff(peaks);
    const medianInterval = median(intervals);
    const stableIntervals = intervals.filter((interval) => {
      const ratio = interval / medianInterval;
      return ratio >= 0.6 && ratio <= 1.4;
    });
    if (stableIntervals.length < Math.max(2, intervals.length * 0.5)) continue;

    const score = intervals.reduce(
      (total, interval, index) => total + interval * corr[peaks[index]],
      0,
    );

    if (!best || score > best.score) {
      best = { score, peaks };
    }
  }

  if (!best) {
    throw new Error("No repetitive gait pattern");
  }

  const refinedLength = Math.min(...diff(best.peaks));
  const refined = averageSegments(signal, channels, best.peaks, refinedLength);
  const corr = slidingCorrTemplate(signal, channels, n, refined, refinedLength);
  const refinedPeaks = findPeaks(corr, CORRELATION_THRESHOLD, minPeakDistance);

  return refinedPeaks.length >= MIN_REPETITIONS ? refinedPeaks : best.peaks;
}
```

In the same file, implement these local helpers:

```ts
function buildSignedChannels(series: UniformSeries): Float64Array {
  const channels = series.gyro ? 6 : 3;
  const out = new Float64Array(series.n * channels);
  const radius = Math.max(1, Math.round(series.fs * 0.5));

  for (let axis = 0; axis < 3; axis += 1) {
    const values = new Float64Array(series.n);
    for (let i = 0; i < series.n; i += 1) values[i] = series.accel[i * 3 + axis];
    const slowMean = movingMean(values, radius);
    for (let i = 0; i < series.n; i += 1) {
      out[i * channels + axis] = values[i] - slowMean[i];
    }
  }

  if (series.gyro) {
    for (let i = 0; i < series.n; i += 1) {
      out[i * channels + 3] = series.gyro[i * 3];
      out[i * channels + 4] = series.gyro[i * 3 + 1];
      out[i * channels + 5] = series.gyro[i * 3 + 2];
    }
  }

  return out;
}

function movingMean(values: Float64Array, radius: number): Float64Array {
  const out = new Float64Array(values.length);
  for (let i = 0; i < values.length; i += 1) {
    let total = 0;
    let count = 0;
    for (let j = Math.max(0, i - radius); j <= Math.min(values.length - 1, i + radius); j += 1) {
      total += values[j];
      count += 1;
    }
    out[i] = total / count;
  }
  return out;
}
```

Then implement the numerical helpers in the same file:

```ts
function slidingCorr(
  signal: Float64Array,
  channels: number,
  n: number,
  start: number,
  length: number,
): Float64Array {
  const template = signal.subarray(start * channels, (start + length) * channels);
  return slidingCorrTemplate(signal, channels, n, template, length);
}

function slidingCorrTemplate(
  signal: Float64Array,
  channels: number,
  n: number,
  template: Float64Array,
  length: number,
): Float64Array {
  const out = new Float64Array(Math.max(0, n - length + 1));
  for (let offset = 0; offset < out.length; offset += 1) {
    let channelTotal = 0;
    for (let channel = 0; channel < channels; channel += 1) {
      channelTotal += pearsonChannel(signal, template, channels, offset, length, channel);
    }
    out[offset] = channelTotal / channels;
  }
  return out;
}

function pearsonChannel(
  signal: Float64Array,
  template: Float64Array,
  channels: number,
  offset: number,
  length: number,
  channel: number,
): number {
  let meanA = 0;
  let meanB = 0;
  for (let i = 0; i < length; i += 1) {
    meanA += template[i * channels + channel];
    meanB += signal[(offset + i) * channels + channel];
  }
  meanA /= length;
  meanB /= length;

  let numerator = 0;
  let denomA = 0;
  let denomB = 0;
  for (let i = 0; i < length; i += 1) {
    const a = template[i * channels + channel] - meanA;
    const b = signal[(offset + i) * channels + channel] - meanB;
    numerator += a * b;
    denomA += a * a;
    denomB += b * b;
  }

  const denom = Math.sqrt(denomA * denomB);
  return denom > 1e-9 ? numerator / denom : 0;
}
```

Finish with:

```ts
function findPeaks(values: Float64Array, height: number, minDistance: number): number[] {
  const peaks: number[] = [];
  for (let i = 1; i < values.length - 1; i += 1) {
    if (values[i] < height || values[i] <= values[i - 1] || values[i] < values[i + 1]) {
      continue;
    }

    const previousIndex = peaks.at(-1);
    if (previousIndex !== undefined && i - previousIndex < minDistance) {
      if (values[i] > values[previousIndex]) peaks[peaks.length - 1] = i;
    } else {
      peaks.push(i);
    }
  }
  return peaks;
}

function diff(values: number[]): number[] {
  return values.slice(1).map((value, index) => value - values[index]);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function averageSegments(
  signal: Float64Array,
  channels: number,
  peaks: number[],
  length: number,
): Float64Array {
  const out = new Float64Array(length * channels);
  let count = 0;

  for (const peak of peaks) {
    if ((peak + length) * channels > signal.length) continue;
    for (let i = 0; i < length * channels; i += 1) out[i] += signal[peak * channels + i];
    count += 1;
  }

  if (count === 0) return out;
  for (let i = 0; i < out.length; i += 1) out[i] /= count;
  return out;
}
```

- [ ] **Step 4: Verify segmentation tests pass**

Run:

```bash
bun test tests/unit/gait-segment.test.ts
```

Expected:

- PASS, 2 tests.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add src/lib/sensors/gait-reconstruction/segment.ts tests/unit/gait-segment.test.ts
git commit -m "feat(gait): segment signed gait cycles"
```

---

## Task 4: Reconstruction Math And Synthetic Ground Truth

**Files:**

- Create: `tests/unit/helpers/synthetic-gait.ts`
- Create: `src/lib/sensors/gait-reconstruction/attitude.ts`
- Create: `src/lib/sensors/gait-reconstruction/reconstruct.ts`
- Create: `src/lib/sensors/gait-reconstruction/heading.ts`
- Create: `src/lib/sensors/gait-reconstruction/aggregate.ts`
- Create: `tests/unit/gait-reconstruction.test.ts`

- [ ] **Step 1: Write the synthetic fixture**

Create `tests/unit/helpers/synthetic-gait.ts`:

```ts
import type { MotionSample } from "../../../src/types/motion";

export function syntheticClosedLoopGait(options?: {
  fs?: number;
  seconds?: number;
  cycleSeconds?: number;
  forwardExcursionM?: number;
  verticalExcursionM?: number;
  lateralExcursionM?: number;
  includeGyro?: boolean;
}): MotionSample[] {
  const fs = options?.fs ?? 50;
  const seconds = options?.seconds ?? 25;
  const cycleSeconds = options?.cycleSeconds ?? 1.1;
  const forwardExcursionM = options?.forwardExcursionM ?? 0.7;
  const verticalExcursionM = options?.verticalExcursionM ?? 0.06;
  const lateralExcursionM = options?.lateralExcursionM ?? 0.04;
  const includeGyro = options?.includeGyro ?? true;
  const w = (2 * Math.PI) / cycleSeconds;
  const n = Math.floor(seconds * fs);

  return Array.from({ length: n }, (_, index) => {
    const t = index / fs;
    const phase = w * t;
    const accelerationX = -0.5 * forwardExcursionM * w * w * Math.sin(phase);
    const accelerationY = 9.81 + 0.5 * verticalExcursionM * w * w * Math.cos(phase);
    const accelerationZ = -0.5 * lateralExcursionM * w * w * Math.sin(phase + Math.PI / 4);

    return {
      timestampMs: t * 1000,
      accelerationX,
      accelerationY,
      accelerationZ,
      rotationAlpha: includeGyro ? 0 : undefined,
      rotationBeta: includeGyro ? 0 : undefined,
      rotationGamma: includeGyro ? 0 : undefined,
    };
  });
}
```

- [ ] **Step 2: Write failing reconstruction tests**

Create `tests/unit/gait-reconstruction.test.ts`:

```ts
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
    const cycles = peaks.slice(0, Math.min(8, peaks.length - 1)).map((peak, index) => {
      const next = peaks[index + 1];
      const attitude = cycleAttitude(series, peak, next);
      return calibrateHeading(reconstructCycle(series, attitude, peak, next));
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
```

- [ ] **Step 3: Run reconstruction tests and verify they fail**

Run:

```bash
bun test tests/unit/gait-reconstruction.test.ts
```

Expected:

- FAIL because reconstruction modules are missing.

- [ ] **Step 4: Implement attitude**

Create `src/lib/sensors/gait-reconstruction/attitude.ts`:

```ts
import { mat3, quat, vec3 } from "gl-matrix";
import type { UniformSeries } from "@/lib/sensors/gait-reconstruction/types";

const WORLD_DOWN = vec3.fromValues(0, -1, 0);

export function cycleAttitude(
  series: UniformSeries,
  p0: number,
  p1: number,
): Float32Array {
  const { fs, accel, gyro } = series;
  const dt = 1 / fs;
  const length = p1 - p0;
  const out = new Float32Array(length * 9);
  const alpha = Math.exp((-2 * Math.PI * 0.3) / fs);
  const gravity = vec3.fromValues(accel[p0 * 3], accel[p0 * 3 + 1], accel[p0 * 3 + 2]);
  const deviceDown = vec3.normalize(vec3.create(), vec3.negate(vec3.create(), gravity));
  const q = quat.rotationTo(quat.create(), deviceDown, WORLD_DOWN);

  for (let i = 0; i < length; i += 1) {
    const index = p0 + i;
    gravity[0] = alpha * gravity[0] + (1 - alpha) * accel[index * 3];
    gravity[1] = alpha * gravity[1] + (1 - alpha) * accel[index * 3 + 1];
    gravity[2] = alpha * gravity[2] + (1 - alpha) * accel[index * 3 + 2];

    if (gyro) {
      const wx = gyro[index * 3];
      const wy = gyro[index * 3 + 1];
      const wz = gyro[index * 3 + 2];
      const magnitude = Math.hypot(wx, wy, wz);
      if (magnitude > 1e-8) {
        const dq = quat.setAxisAngle(
          quat.create(),
          vec3.fromValues(wx / magnitude, wy / magnitude, wz / magnitude),
          magnitude * dt,
        );
        quat.multiply(q, q, dq);
      }
    }

    const measuredDown = vec3.normalize(vec3.create(), vec3.negate(vec3.create(), gravity));
    const predictedDown = vec3.transformQuat(vec3.create(), measuredDown, q);
    const correction = quat.rotationTo(quat.create(), predictedDown, WORLD_DOWN);
    quat.slerp(correction, quat.create(), correction, 0.02);
    quat.multiply(q, correction, q);
    quat.normalize(q, q);

    out.set(mat3.fromQuat(mat3.create(), q), i * 9);
  }

  return out;
}
```

- [ ] **Step 5: Implement reconstruction**

Create `src/lib/sensors/gait-reconstruction/reconstruct.ts` with:

```ts
import { mat3, quat, vec3 } from "gl-matrix";
import type {
  CycleRepresentation,
  UniformSeries,
} from "@/lib/sensors/gait-reconstruction/types";

const PHASE_UNITS = 100;

export function reconstructCycle(
  series: UniformSeries,
  attitude: Float32Array,
  p0: number,
  p1: number,
): CycleRepresentation {
  const length = p1 - p0;
  const worldAccel = new Float64Array(length * 3);

  for (let i = 0; i < length; i += 1) {
    const m = mat3.clone(attitude.subarray(i * 9, i * 9 + 9) as unknown as mat3);
    const a = vec3.fromValues(
      series.accel[(p0 + i) * 3],
      series.accel[(p0 + i) * 3 + 1],
      series.accel[(p0 + i) * 3 + 2],
    );
    vec3.transformMat3(a, a, m);
    worldAccel[i * 3] = a[0];
    worldAccel[i * 3 + 1] = a[1];
    worldAccel[i * 3 + 2] = a[2];
  }

  const disp = closedDoubleIntegrate(worldAccel, length, 1 / series.fs);
  const ori = relativeOrientation(attitude, length);
  return {
    disp: resampleChannels(disp, length, PHASE_UNITS),
    ori: resampleChannels(ori, length, PHASE_UNITS),
  };
}
```

Add these helpers in the same file:

```ts
function closedDoubleIntegrate(accel: Float64Array, length: number, dt: number): Float64Array {
  const disp = new Float64Array(length * 3);

  for (let axis = 0; axis < 3; axis += 1) {
    const a = new Float64Array(length);
    const v = new Float64Array(length);
    const d = new Float64Array(length);
    let accelMean = 0;
    for (let i = 0; i < length; i += 1) accelMean += accel[i * 3 + axis];
    accelMean /= length;
    for (let i = 0; i < length; i += 1) a[i] = accel[i * 3 + axis] - accelMean;
    for (let i = 1; i < length; i += 1) v[i] = v[i - 1] + 0.5 * (a[i] + a[i - 1]) * dt;
    const velocityMean = mean(v);
    for (let i = 0; i < length; i += 1) v[i] -= velocityMean;
    for (let i = 1; i < length; i += 1) d[i] = d[i - 1] + 0.5 * (v[i] + v[i - 1]) * dt;
    for (let i = 0; i < length; i += 1) disp[i * 3 + axis] = d[i] - d[0];
  }

  return disp;
}

function relativeOrientation(attitude: Float32Array, length: number): Float64Array {
  const mid = mat3.clone(attitude.subarray((length >> 1) * 9, (length >> 1) * 9 + 9) as unknown as mat3);
  const meanInv = quat.invert(quat.create(), quat.fromMat3(quat.create(), mid));
  const out = new Float64Array(length * 3);

  for (let i = 0; i < length; i += 1) {
    const m = mat3.clone(attitude.subarray(i * 9, i * 9 + 9) as unknown as mat3);
    const qr = quat.multiply(quat.create(), meanInv, quat.fromMat3(quat.create(), m));
    quat.normalize(qr, qr);
    const angle = 2 * Math.acos(Math.min(1, Math.abs(qr[3])));
    const scale = angle > 1e-6 ? angle / Math.sin(angle / 2) : 0;
    out[i * 3] = qr[0] * scale;
    out[i * 3 + 1] = qr[1] * scale;
    out[i * 3 + 2] = qr[2] * scale;
  }

  return out;
}

function resampleChannels(values: Float64Array, fromLength: number, toLength: number): Float64Array {
  const out = new Float64Array(toLength * 3);
  if (fromLength === 0) return out;

  for (let i = 0; i < toLength; i += 1) {
    const position = (i / (toLength - 1)) * (fromLength - 1);
    const left = Math.floor(position);
    const right = Math.min(fromLength - 1, left + 1);
    const weight = position - left;
    for (let axis = 0; axis < 3; axis += 1) {
      out[i * 3 + axis] =
        values[left * 3 + axis] + weight * (values[right * 3 + axis] - values[left * 3 + axis]);
    }
  }

  return out;
}

function mean(values: Float64Array): number {
  let total = 0;
  for (const value of values) total += value;
  return values.length ? total / values.length : 0;
}
```

- [ ] **Step 6: Implement heading and aggregation**

Create `src/lib/sensors/gait-reconstruction/heading.ts`:

```ts
import type { CycleRepresentation } from "@/lib/sensors/gait-reconstruction/types";

export function calibrateHeading(rep: CycleRepresentation): CycleRepresentation {
  const d = rep.disp;
  const n = d.length / 3;
  let mx = 0;
  let mz = 0;
  for (let i = 0; i < n; i += 1) {
    mx += d[i * 3];
    mz += d[i * 3 + 2];
  }
  mx /= n;
  mz /= n;

  let a = 0;
  let b = 0;
  let c = 0;
  for (let i = 0; i < n; i += 1) {
    const x = d[i * 3] - mx;
    const z = d[i * 3 + 2] - mz;
    a += x * x;
    b += x * z;
    c += z * z;
  }

  const theta = 0.5 * Math.atan2(2 * b, a - c);
  const fx = Math.cos(theta);
  const fz = Math.sin(theta);
  const rx = -fz;
  const rz = fx;
  const out = new Float64Array(n * 3);

  for (let i = 0; i < n; i += 1) {
    const x = d[i * 3];
    const y = d[i * 3 + 1];
    const z = d[i * 3 + 2];
    out[i * 3] = x * fx + z * fz;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = x * rx + z * rz;
  }

  return { disp: out, ori: rep.ori };
}
```

Create `src/lib/sensors/gait-reconstruction/aggregate.ts`:

```ts
import type { CycleRepresentation } from "@/lib/sensors/gait-reconstruction/types";

export function aggregateCycles(cycles: CycleRepresentation[]): CycleRepresentation {
  const length = cycles[0]?.disp.length ?? 0;
  const disp = new Float64Array(length);
  const ori = new Float64Array(length);

  for (const cycle of cycles) {
    for (let i = 0; i < length; i += 1) {
      disp[i] += cycle.disp[i];
      ori[i] += cycle.ori[i];
    }
  }

  if (cycles.length > 0) {
    for (let i = 0; i < length; i += 1) {
      disp[i] /= cycles.length;
      ori[i] /= cycles.length;
    }
  }

  return { disp, ori };
}
```

- [ ] **Step 7: Verify reconstruction primitive tests pass**

Run:

```bash
bun test tests/unit/gait-reconstruction.test.ts
```

Expected:

- PASS, 1 test.

- [ ] **Step 8: Commit Task 4**

Run:

```bash
git add tests/unit/helpers/synthetic-gait.ts src/lib/sensors/gait-reconstruction/attitude.ts src/lib/sensors/gait-reconstruction/reconstruct.ts src/lib/sensors/gait-reconstruction/heading.ts src/lib/sensors/gait-reconstruction/aggregate.ts tests/unit/gait-reconstruction.test.ts
git commit -m "feat(gait): reconstruct canonical gait cycles"
```

---

## Task 5: Parameters And Orchestrator

**Files:**

- Create: `src/lib/sensors/gait-reconstruction/parameters.ts`
- Create: `src/lib/sensors/gait-reconstruction/analyze.ts`
- Modify: `tests/unit/gait-reconstruction.test.ts`

- [ ] **Step 1: Add failing parameter and orchestrator tests**

Add this import to the import block at the top of `tests/unit/gait-reconstruction.test.ts`:

```ts
import { analyzeGaitReconstruction } from "../../src/lib/sensors/gait-reconstruction/analyze";
```

Append these tests to `tests/unit/gait-reconstruction.test.ts`:

```ts
describe("analyzeGaitReconstruction", () => {
  test("returns full reconstruction metrics for gyro-capable samples", () => {
    const result = analyzeGaitReconstruction({
      durationSeconds: 25,
      samples: syntheticClosedLoopGait({ includeGyro: true }),
      stepLengthMeters: 0.68,
    });

    expect(result.completionStatus).toBe("completed");
    expect(result.mode).toBe("full");
    expect(result.cycleCount).toBeGreaterThanOrEqual(12);
    expect(result.cadenceStepsPerMinute).toBeGreaterThan(90);
    expect(result.cadenceStepsPerMinute).toBeLessThan(130);
    expect(result.shape.verticalExcursionM).toBeGreaterThan(0.035);
    expect(result.shape.forwardExcursionM).toBeGreaterThan(0.35);
    expect(result.absoluteEstimateMethod).toBe("height_regression");
  });

  test("returns reduced metrics when gyro is absent", () => {
    const result = analyzeGaitReconstruction({
      durationSeconds: 25,
      samples: syntheticClosedLoopGait({ includeGyro: false }),
      stepLengthMeters: 0.68,
    });

    expect(result.completionStatus).toBe("completed");
    expect(result.mode).toBe("reduced");
    expect(result.shape.verticalExcursionM).toBeGreaterThan(0.035);
    expect(result.shape.forwardExcursionM).toBeUndefined();
    expect(result.shape.symmetry).toBeUndefined();
  });

  test("fails closed for static captures", () => {
    const samples = syntheticClosedLoopGait().map((sample) => ({
      ...sample,
      accelerationX: 0,
      accelerationY: 9.81,
      accelerationZ: 0,
      rotationAlpha: 0,
      rotationBeta: 0,
      rotationGamma: 0,
    }));

    const result = analyzeGaitReconstruction({
      durationSeconds: 25,
      samples,
      stepLengthMeters: 0.68,
    });

    expect(result.completionStatus).toBe("stopped");
    expect(result.mode).toBe("heuristic");
    expect(result.quality).toBe(0);
  });
});
```

- [ ] **Step 2: Run the orchestrator tests and verify they fail**

Run:

```bash
bun test tests/unit/gait-reconstruction.test.ts
```

Expected:

- FAIL because `analyzeGaitReconstruction` is missing.

- [ ] **Step 3: Implement parameter assembly**

Create `src/lib/sensors/gait-reconstruction/parameters.ts`:

```ts
import type { GaitSpeedEstimateSource } from "@/lib/sensors/gait-metrics";
import type {
  CycleRepresentation,
  TrajectoryShape,
} from "@/lib/sensors/gait-reconstruction/types";

export type AbsoluteEstimateMethod = "height_regression" | "course_distance" | "none";

export function cycleIntervalsSeconds(peaks: number[], fs: number): number[] {
  return peaks.slice(1).map((peak, index) => (peak - peaks[index]) / fs);
}

export function inferStepsPerCycle(cycleCount: number, magnitudeStepCount: number): 1 | 2 {
  if (cycleCount <= 0 || magnitudeStepCount <= 0) return 2;
  const ratio = magnitudeStepCount / cycleCount;
  return ratio >= 1.5 ? 2 : 1;
}

export function trajectoryShape(canonical: CycleRepresentation | null): TrajectoryShape {
  if (!canonical) return {};

  return {
    verticalExcursionM: roundMetric(range(canonical.disp, 1)),
    forwardExcursionM: roundMetric(range(canonical.disp, 0)),
    lateralSwayM: roundMetric(range(canonical.disp, 2)),
    pathLengthM: roundMetric(pathLength(canonical.disp)),
    symmetry: roundScore(symmetryScore(canonical.disp)),
  };
}

export function verticalOnlyShape(vertical: Float64Array): TrajectoryShape {
  return { verticalExcursionM: roundMetric(rangeScalar(vertical)) };
}

export function absoluteEstimate(input: {
  distanceMeters?: number;
  stepLengthMeters?: number;
}): {
  method: AbsoluteEstimateMethod;
  gaitSpeedEstimateSource?: GaitSpeedEstimateSource;
} {
  if (input.distanceMeters !== undefined && input.distanceMeters > 0) {
    return { method: "course_distance", gaitSpeedEstimateSource: "course_distance" };
  }
  if (input.stepLengthMeters !== undefined && input.stepLengthMeters > 0) {
    return { method: "height_regression", gaitSpeedEstimateSource: "estimated_step_length" };
  }
  return { method: "none" };
}
```

Add helpers in the same file:

```ts
export function mean(values: number[]): number {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const center = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - center) ** 2)));
}

function range(values: Float64Array, axis: 0 | 1 | 2): number {
  const axisValues: number[] = [];
  for (let i = axis; i < values.length; i += 3) axisValues.push(values[i]);
  return Math.max(...axisValues) - Math.min(...axisValues);
}

function rangeScalar(values: Float64Array): number {
  return values.length ? Math.max(...values) - Math.min(...values) : 0;
}

function pathLength(values: Float64Array): number {
  let total = 0;
  for (let i = 3; i < values.length; i += 3) {
    total += Math.hypot(
      values[i] - values[i - 3],
      values[i + 1] - values[i - 2],
      values[i + 2] - values[i - 1],
    );
  }
  return total;
}

function symmetryScore(values: Float64Array): number {
  const n = values.length / 3;
  const half = Math.floor(n / 2);
  let error = 0;
  let scale = 0;

  for (let i = 0; i < half; i += 1) {
    for (let axis = 0; axis < 3; axis += 1) {
      const a = values[i * 3 + axis];
      const b = values[(i + half) * 3 + axis];
      error += (a - b) ** 2;
      scale += a ** 2 + b ** 2;
    }
  }

  if (scale <= 1e-9) return 0;
  return Math.max(0, Math.min(1, 1 - Math.sqrt(error / scale)));
}

function roundMetric(value: number): number {
  return Number(value.toFixed(3));
}

function roundScore(value: number): number {
  return Math.min(1, Math.max(0, Number(value.toFixed(2))));
}
```

- [ ] **Step 4: Implement the orchestrator**

Create `src/lib/sensors/gait-reconstruction/analyze.ts`:

```ts
import { aggregateCycles } from "@/lib/sensors/gait-reconstruction/aggregate";
import { cycleAttitude } from "@/lib/sensors/gait-reconstruction/attitude";
import { calibrateHeading } from "@/lib/sensors/gait-reconstruction/heading";
import {
  absoluteEstimate,
  cycleIntervalsSeconds,
  inferStepsPerCycle,
  mean,
  standardDeviation,
  trajectoryShape,
  verticalOnlyShape,
} from "@/lib/sensors/gait-reconstruction/parameters";
import { reconstructCycle } from "@/lib/sensors/gait-reconstruction/reconstruct";
import { resampleGaitSeries } from "@/lib/sensors/gait-reconstruction/resample";
import { segmentGaitCycles } from "@/lib/sensors/gait-reconstruction/segment";
import type {
  CycleRepresentation,
  GaitReconstructionResult,
} from "@/lib/sensors/gait-reconstruction/types";
import { detectGaitCycles } from "@/lib/sensors/gait-cycle";
import {
  validMotionSamples,
  validateGaitCapture,
} from "@/lib/sensors/gait-protocol";
import { summarizeGaitMetrics } from "@/lib/sensors/gait-metrics";
import type { MotionSample } from "@/types/motion";

export type GaitReconstructionInput = {
  samples: MotionSample[];
  durationSeconds: number;
  distanceMeters?: number;
  stepLengthMeters?: number;
};

export type GaitReconstructionSummary = GaitReconstructionResult & {
  stabilityScore: number;
  rhythmConsistency: number;
  stepCount: number;
  gaitSpeedMetersPerSecond?: number;
  estimatedGaitSpeedMetersPerSecond?: number;
  gaitSpeedEstimateSource?: "course_distance" | "estimated_step_length";
  absoluteEstimateMethod: "height_regression" | "course_distance" | "none";
  stepTimeMeanSeconds?: number;
  stepTimeVariability?: number;
  jerkVariability?: number;
  rotationVariability?: number;
};

export function analyzeGaitReconstruction(
  input: GaitReconstructionInput,
): GaitReconstructionSummary {
  const samples = validMotionSamples(input.samples);
  const quality = validateGaitCapture({ samples, durationSeconds: input.durationSeconds });
  const heuristic = summarizeGaitMetrics(input);
  const estimate = absoluteEstimate(input);

  if (!quality.usable) {
    return stoppedSummary(quality.issue, estimate.method);
  }

  try {
    const series = resampleGaitSeries(samples);
    const peaks = segmentGaitCycles(series);
    if (peaks.length < 3) return heuristicOrStopped(heuristic, estimate.method);

    const magnitude = detectGaitCycles(samples);
    const intervals = cycleIntervalsSeconds(peaks, series.fs);
    const cycleCount = Math.max(0, peaks.length - 1);
    const stepsPerCycle = inferStepsPerCycle(cycleCount, magnitude.steps.length);

    if (!series.gyro) {
      return {
        ...heuristicFields(heuristic),
        completionStatus: "completed",
        mode: "reduced",
        cycleCount,
        cycleTimeS: round(mean(intervals)),
        cycleTimeVariabilityS: round(standardDeviation(intervals)),
        cadenceStepsPerMinute: round((stepsPerCycle * 60) / mean(intervals), 1),
        stepsPerCycle,
        canonical: null,
        perCycle: [],
        shape: verticalOnlyShape(reconstructVertical(series, peaks[0], peaks[1])),
        quality: heuristic.cycleQualityScore,
        absoluteEstimateMethod: estimate.method,
      };
    }

    const cycles: CycleRepresentation[] = [];
    for (let i = 0; i < peaks.length - 1; i += 1) {
      const attitude = cycleAttitude(series, peaks[i], peaks[i + 1]);
      cycles.push(calibrateHeading(reconstructCycle(series, attitude, peaks[i], peaks[i + 1])));
    }
    const canonical = aggregateCycles(cycles);

    return {
      ...heuristicFields(heuristic),
      completionStatus: "completed",
      mode: "full",
      cycleCount,
      cycleTimeS: round(mean(intervals)),
      cycleTimeVariabilityS: round(standardDeviation(intervals)),
      cadenceStepsPerMinute: round((stepsPerCycle * 60) / mean(intervals), 1),
      stepsPerCycle,
      canonical,
      perCycle: cycles,
      shape: trajectoryShape(canonical),
      quality: heuristic.cycleQualityScore,
      absoluteEstimateMethod: estimate.method,
    };
  } catch (error) {
    return heuristicOrStopped(
      heuristic,
      estimate.method,
      error instanceof Error ? error.message : "reconstruction_failed",
    );
  }
}
```

Add helpers in the same file:

```ts
function heuristicFields(
  heuristic: ReturnType<typeof summarizeGaitMetrics>,
): Pick<
  GaitReconstructionSummary,
  | "stabilityScore"
  | "rhythmConsistency"
  | "stepCount"
  | "gaitSpeedMetersPerSecond"
  | "estimatedGaitSpeedMetersPerSecond"
  | "gaitSpeedEstimateSource"
  | "stepTimeMeanSeconds"
  | "stepTimeVariability"
  | "jerkVariability"
  | "rotationVariability"
> {
  return {
    stabilityScore: heuristic.stabilityScore,
    rhythmConsistency: heuristic.rhythmConsistency,
    stepCount: heuristic.stepCount,
    gaitSpeedMetersPerSecond: heuristic.gaitSpeedMetersPerSecond,
    estimatedGaitSpeedMetersPerSecond: heuristic.estimatedGaitSpeedMetersPerSecond,
    gaitSpeedEstimateSource: heuristic.gaitSpeedEstimateSource,
    stepTimeMeanSeconds: heuristic.stepTimeMeanSeconds,
    stepTimeVariability: heuristic.stepTimeVariability,
    jerkVariability: heuristic.jerkVariability,
    rotationVariability: heuristic.rotationVariability,
  };
}

function heuristicOrStopped(
  heuristic: ReturnType<typeof summarizeGaitMetrics>,
  method: GaitReconstructionSummary["absoluteEstimateMethod"],
  failureReason = "reconstruction_unavailable",
): GaitReconstructionSummary {
  if (heuristic.completionStatus === "completed") {
    return {
      ...heuristicFields(heuristic),
      completionStatus: "completed",
      mode: "heuristic",
      cycleCount: 0,
      canonical: null,
      perCycle: [],
      shape: {},
      quality: heuristic.cycleQualityScore,
      absoluteEstimateMethod: method,
      failureReason,
    };
  }

  return stoppedSummary(failureReason, method);
}

function stoppedSummary(
  failureReason: string,
  method: GaitReconstructionSummary["absoluteEstimateMethod"] = "none",
): GaitReconstructionSummary {
  return {
    completionStatus: "stopped",
    mode: "heuristic",
    cycleCount: 0,
    canonical: null,
    perCycle: [],
    shape: {},
    quality: 0,
    stabilityScore: 0,
    rhythmConsistency: 0,
    stepCount: 0,
    absoluteEstimateMethod: method,
    failureReason,
  };
}

function reconstructVertical(series: { accel: Float64Array; fs: number }, p0: number, p1: number): Float64Array {
  const length = p1 - p0;
  const out = new Float64Array(length);
  const dt = 1 / series.fs;
  const acceleration = new Float64Array(length);
  for (let i = 0; i < length; i += 1) acceleration[i] = series.accel[(p0 + i) * 3 + 1];
  const averageAcceleration = mean(Array.from(acceleration));
  const velocity = new Float64Array(length);
  const displacement = new Float64Array(length);
  for (let i = 0; i < length; i += 1) acceleration[i] -= averageAcceleration;
  for (let i = 1; i < length; i += 1) {
    velocity[i] = velocity[i - 1] + 0.5 * (acceleration[i] + acceleration[i - 1]) * dt;
  }
  const averageVelocity = mean(Array.from(velocity));
  for (let i = 0; i < length; i += 1) velocity[i] -= averageVelocity;
  for (let i = 1; i < length; i += 1) {
    displacement[i] = displacement[i - 1] + 0.5 * (velocity[i] + velocity[i - 1]) * dt;
  }
  return displacement;
}

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}
```

- [ ] **Step 5: Verify orchestrator tests pass**

Run:

```bash
bun test tests/unit/gait-reconstruction.test.ts
```

Expected:

- PASS, 4 tests.

- [ ] **Step 6: Commit Task 5**

Run:

```bash
git add src/lib/sensors/gait-reconstruction/parameters.ts src/lib/sensors/gait-reconstruction/analyze.ts tests/unit/gait-reconstruction.test.ts
git commit -m "feat(gait): assemble reconstruction gait metrics"
```

---

## Task 6: Motion Summary Integration

**Files:**

- Modify: `src/lib/sensors/motion-summary.ts`
- Modify: `tests/unit/motion-summary.test.ts`
- Modify: `tests/unit/direct-gait-flow.test.ts`

- [ ] **Step 1: Add failing motion summary expectations**

In `tests/unit/motion-summary.test.ts`, extend the existing `"maps detailed gait metrics onto MotionMetrics"` test with:

```ts
    expect(metrics.analysisMode).toMatch(/^(heuristic|reconstruction_full|reconstruction_reduced)$/);
    expect(metrics.absoluteEstimateMethod).toBe("height_regression");
```

Add a reduced-mode test:

```ts
  test("maps reduced reconstruction when gyro is absent", () => {
    const samples = regularWalk(25).map((sample) => ({
      timestampMs: sample.timestampMs,
      accelerationX: sample.accelerationX,
      accelerationY: sample.accelerationY,
      accelerationZ: sample.accelerationZ,
    }));

    const metrics = summarizeMotionSamples({
      durationSeconds: 25,
      samples,
      stepLengthMeters: 0.68,
    });

    expect(metrics.completionStatus).toBe("completed");
    expect(metrics.source).toBe("accelerometer");
    expect(metrics.analysisMode).toBe("reconstruction_reduced");
    expect(metrics.trajectoryShape?.verticalExcursionM).toBeGreaterThan(0);
    expect(metrics.trajectoryShape?.forwardExcursionM).toBeUndefined();
  });
```

In `tests/unit/direct-gait-flow.test.ts`, extend `"summarizes a direct 25 second pocket walk as accelerometer metrics"` with:

```ts
    expect(metrics.absoluteEstimateMethod).toBe("height_regression");
```

- [ ] **Step 2: Run motion summary tests and verify they fail**

Run:

```bash
bun test tests/unit/motion-summary.test.ts tests/unit/direct-gait-flow.test.ts
```

Expected:

- FAIL because `summarizeMotionSamples()` does not call the reconstruction analyzer.

- [ ] **Step 3: Map reconstruction summary into `MotionMetrics`**

Modify `src/lib/sensors/motion-summary.ts` so it imports `analyzeGaitReconstruction` instead of `summarizeGaitMetrics`:

```ts
import { analyzeGaitReconstruction } from "@/lib/sensors/gait-reconstruction/analyze";
import type { MotionMetrics } from "@/types/assessment";
import type { MotionSample } from "@/types/motion";
```

Replace `summarizeMotionSamples`:

```ts
export function summarizeMotionSamples(input: {
  samples: MotionSample[];
  distanceMeters?: number;
  durationSeconds: number;
  stepLengthMeters?: number;
}): MotionMetrics {
  const metrics = analyzeGaitReconstruction(input);

  if (metrics.completionStatus === "stopped") {
    return getUnavailableMotionMetrics("accelerometer");
  }

  return {
    stabilityScore: metrics.stabilityScore,
    rhythmConsistency: metrics.rhythmConsistency,
    gaitSpeedMetersPerSecond: metrics.gaitSpeedMetersPerSecond,
    estimatedGaitSpeedMetersPerSecond: metrics.estimatedGaitSpeedMetersPerSecond,
    gaitSpeedEstimateSource: metrics.gaitSpeedEstimateSource,
    analysisMode:
      metrics.mode === "full"
        ? "reconstruction_full"
        : metrics.mode === "reduced"
          ? "reconstruction_reduced"
          : "heuristic",
    absoluteEstimateMethod: metrics.absoluteEstimateMethod,
    trajectoryShape:
      Object.keys(metrics.shape).length > 0 ? metrics.shape : undefined,
    stepCount: metrics.stepCount,
    cadenceStepsPerMinute: metrics.cadenceStepsPerMinute,
    stepTimeMeanSeconds: metrics.stepTimeMeanSeconds,
    stepTimeVariability: metrics.stepTimeVariability,
    jerkVariability: metrics.jerkVariability,
    rotationVariability: metrics.rotationVariability,
    cycleQualityScore: metrics.quality,
    completionStatus: "completed",
    source: "accelerometer",
  };
}
```

- [ ] **Step 4: Keep demo and unavailable metrics explicit**

Modify `getDemoMotionMetrics()`:

```ts
export function getDemoMotionMetrics(): MotionMetrics {
  return {
    stabilityScore: 0.62,
    rhythmConsistency: 0.58,
    gaitSpeedMetersPerSecond: 0.82,
    absoluteEstimateMethod: "height_regression",
    completionStatus: "demo",
    source: "demo",
  };
}
```

Modify `getUnavailableMotionMetrics()`:

```ts
export function getUnavailableMotionMetrics(
  source: "accelerometer" | "manual" = "manual",
): MotionMetrics {
  return {
    stabilityScore: 0,
    rhythmConsistency: 0,
    absoluteEstimateMethod: "none",
    completionStatus: "stopped",
    source,
  };
}
```

- [ ] **Step 5: Verify integration tests pass**

Run:

```bash
bun test tests/unit/motion-summary.test.ts tests/unit/direct-gait-flow.test.ts
```

Expected:

- PASS.

- [ ] **Step 6: Run existing gait metric tests**

Run:

```bash
bun test tests/unit/gait-metrics.test.ts tests/unit/gait-cycle.test.ts tests/unit/gait-protocol.test.ts
```

Expected:

- PASS. These tests protect the heuristic fallback and magnitude detector.

- [ ] **Step 7: Commit Task 6**

Run:

```bash
git add src/lib/sensors/motion-summary.ts tests/unit/motion-summary.test.ts tests/unit/direct-gait-flow.test.ts
git commit -m "feat(gait): map reconstruction into motion summary"
```

---

## Task 7: Gait Screen Transparency Labels

**Files:**

- Modify: `src/components/assessment/screens/GaitScreen.tsx`

- [ ] **Step 1: Add display helpers near the top of the file**

In `src/components/assessment/screens/GaitScreen.tsx`, below `formatOptionalNumber`, add:

```ts
function gaitSpeedLabel(motion: MotionMetrics) {
  if (motion.absoluteEstimateMethod === "course_distance") {
    return "Course speed";
  }
  if (motion.gaitSpeedMetersPerSecond !== undefined) {
    return "Estimated speed";
  }
  return "Gait speed";
}

function analysisModeLabel(mode: MotionMetrics["analysisMode"]) {
  switch (mode) {
    case "reconstruction_full":
      return "Full sensor";
    case "reconstruction_reduced":
      return "Reduced sensor";
    case "heuristic":
      return "Heuristic";
    default:
      return "Not measured";
  }
}

function shapeResultItem(motion: MotionMetrics) {
  const shape = motion.trajectoryShape;
  if (shape?.symmetry !== undefined) {
    return {
      label: "Symmetry",
      value: `${Math.round(shape.symmetry * 100)}%`,
    };
  }
  if (shape?.verticalExcursionM !== undefined) {
    return {
      label: "Vertical motion",
      value: `${Math.round(shape.verticalExcursionM * 100)} cm`,
    };
  }
  return null;
}
```

- [ ] **Step 2: Update result items**

Inside the `TestStartPanel` props, replace the first result item:

```ts
          {
            label: gaitSpeedLabel(motion),
            value: `${motion.gaitSpeedMetersPerSecond ?? 0} m/s`,
          },
```

Add this result item after the Quality item:

```ts
          {
            label: "Mode",
            value: analysisModeLabel(motion.analysisMode),
          },
```

Then change the `resultItems` prop to append the optional shape tile:

```ts
        resultItems={[
          {
            label: gaitSpeedLabel(motion),
            value: `${motion.gaitSpeedMetersPerSecond ?? 0} m/s`,
          },
          {
            label: "Cadence",
            value: formatOptionalNumber(
              motion.cadenceStepsPerMinute,
              " steps/min",
            ),
          },
          {
            label: "Steps",
            value:
              motion.stepCount === undefined
                ? "Not measured"
                : String(motion.stepCount),
          },
          {
            label: "Rhythm",
            value: `${Math.round(motion.rhythmConsistency * 100)}%`,
          },
          {
            label: "Stability",
            value: `${Math.round(motion.stabilityScore * 100)}%`,
          },
          {
            label: "Quality",
            value: `${Math.round((motion.cycleQualityScore ?? 0) * 100)}%`,
          },
          {
            label: "Mode",
            value: analysisModeLabel(motion.analysisMode),
          },
          ...(shapeResultItem(motion) ? [shapeResultItem(motion)!] : []),
        ]}
```

- [ ] **Step 3: Update speed status label**

In `statusItems`, replace the current speed status value with:

```ts
          {
            label: "Speed",
            value:
              motion.absoluteEstimateMethod === "course_distance"
                ? "Course distance"
                : motion.absoluteEstimateMethod === "height_regression"
                  ? "Estimated"
                  : "Not measured",
          },
```

- [ ] **Step 4: Verify TypeScript and lint for the screen change**

Run:

```bash
bun run lint
```

Expected:

- PASS.

- [ ] **Step 5: Commit Task 7**

Run:

```bash
git add src/components/assessment/screens/GaitScreen.tsx
git commit -m "feat(gait): label reconstructed gait estimates"
```

---

## Task 8: Full Verification

**Files:**

- No planned source edits.
- Modify source only to fix failures surfaced by the verification commands.

- [ ] **Step 1: Run all unit tests**

Run:

```bash
bun test tests/unit
```

Expected:

- PASS.

- [ ] **Step 2: Run lint**

Run:

```bash
bun run lint
```

Expected:

- PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
bun run build
```

Expected:

- PASS.

- [ ] **Step 4: Inspect git status**

Run:

```bash
git status --short
```

Expected:

- Clean worktree, or only intentional files already committed.

- [ ] **Step 5: Prepare implementation summary**

Summarize:

- Dependency added: `gl-matrix`.
- Reconstruction modules added under `src/lib/sensors/gait-reconstruction/`.
- Capture now requires `accelerationIncludingGravity`.
- `MotionMetrics` gained optional mode, estimate, and trajectory-shape fields.
- Gait UI labels estimated speed and sensor mode.
- Verification results from unit tests, lint, and build.
