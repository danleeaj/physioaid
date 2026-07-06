# Short Active Pocket Gait Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 25 second active pocket-walk gait engine that derives OneStep-inspired rhythm, stability, cadence, step count, and estimated speed metrics from browser motion samples while preserving Physio-Aid safety gates and fallbacks.

**Architecture:** Split gait analysis into focused sensor modules: protocol/sample-quality checks, cycle detection, and metric scoring. Keep `motion-summary.ts` as the compatibility facade that maps detailed gait output onto the existing `MotionMetrics` contract used by the assessment flow.

**Tech Stack:** Next.js 16, React 19, TypeScript, browser `DeviceMotionEvent`, `bun:test`, existing `npm run lint` and `npm run build` verification.

---

## File Structure

- Create: `src/lib/sensors/gait-protocol.ts`
  - Owns the 25 second target, 20-30 second accepted window, sample validation, and reusable numeric helpers.
- Create: `src/lib/sensors/gait-cycle.ts`
  - Detects step peaks and step intervals from valid accelerometer samples.
- Create: `src/lib/sensors/gait-metrics.ts`
  - Computes detailed derived gait metrics and quality scores from samples and detected cycles.
- Modify: `src/lib/sensors/motion-summary.ts`
  - Delegates automatic gait summaries to `gait-metrics.ts` and preserves demo/unavailable helpers.
- Modify: `src/types/assessment.ts`
  - Adds optional detailed gait fields to `MotionMetrics`.
- Modify: `src/components/assessment/useAssessmentFlow.ts`
  - Passes step-length context into the motion summary and stops fabricating passing gait results when samples are missing.
- Modify: `src/components/assessment/screens/GaitScreen.tsx`
  - Makes the guided gait test a 25 second timed pocket walk instead of a distance auto-stop walk.
- Create: `tests/unit/gait-protocol.test.ts`
- Create: `tests/unit/gait-cycle.test.ts`
- Create: `tests/unit/gait-metrics.test.ts`
- Create: `tests/unit/motion-summary.test.ts`

## Task 1: Gait Protocol And Sample Quality

**Files:**
- Create: `tests/unit/gait-protocol.test.ts`
- Create: `src/lib/sensors/gait-protocol.ts`

- [ ] **Step 1: Write failing protocol tests**

Create `tests/unit/gait-protocol.test.ts`:

```ts
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

function walkingSamples(seconds: number, hz = 50, amplitude = 1): MotionSample[] {
  return Array.from({ length: Math.floor(seconds * hz) }, (_, index) =>
    sampleAt(index, hz, amplitude),
  );
}

describe("gaitProtocol", () => {
  test("uses a 25 second target with a 20 to 30 second accepted window", () => {
    expect(gaitProtocol.targetDurationSeconds).toBe(25);
    expect(gaitProtocol.minDurationSeconds).toBe(20);
    expect(gaitProtocol.maxDurationSeconds).toBe(30);
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
  test("accepts a normal 25 second active walk", () => {
    const result = validateGaitCapture({
      durationSeconds: 25,
      samples: walkingSamples(25),
    });

    expect(result.usable).toBe(true);
    expect(result.issue).toBe("ok");
    expect(result.sampleRateHz).toBeGreaterThanOrEqual(45);
  });

  test("rejects active walks shorter than 20 seconds", () => {
    const result = validateGaitCapture({
      durationSeconds: 19.9,
      samples: walkingSamples(19.9),
    });

    expect(result.usable).toBe(false);
    expect(result.issue).toBe("duration_too_short");
  });

  test("rejects active walks longer than 30 seconds", () => {
    const result = validateGaitCapture({
      durationSeconds: 30.5,
      samples: walkingSamples(30.5),
    });

    expect(result.usable).toBe(false);
    expect(result.issue).toBe("duration_too_long");
  });

  test("rejects low sample-rate captures", () => {
    const result = validateGaitCapture({
      durationSeconds: 25,
      samples: walkingSamples(25, 10),
    });

    expect(result.usable).toBe(false);
    expect(result.issue).toBe("low_sample_rate");
  });

  test("rejects static samples", () => {
    const staticSamples = walkingSamples(25).map((sample) => ({
      ...sample,
      accelerationX: 0,
      accelerationY: 0,
      accelerationZ: 9.81,
      rotationAlpha: 0,
      rotationBeta: 0,
      rotationGamma: 0,
    }));

    const result = validateGaitCapture({
      durationSeconds: 25,
      samples: staticSamples,
    });

    expect(result.usable).toBe(false);
    expect(result.issue).toBe("static_signal");
  });
});
```

- [ ] **Step 2: Run protocol tests to verify they fail**

Run:

```bash
bun test tests/unit/gait-protocol.test.ts
```

Expected: `FAIL` because `src/lib/sensors/gait-protocol.ts` does not exist.

- [ ] **Step 3: Implement gait protocol helpers**

Create `src/lib/sensors/gait-protocol.ts`:

```ts
import type { MotionSample } from "@/types/motion";

export const gaitProtocol = {
  targetDurationSeconds: 25,
  minDurationSeconds: 20,
  maxDurationSeconds: 30,
  minSampleRateHz: 20,
  minValidSamples: 240,
  minSignalRange: 0.15,
  minDetectedSteps: 8,
  minimumStepIntervalSeconds: 0.3,
  maximumStepIntervalSeconds: 1.4,
} as const;

export type GaitCaptureIssue =
  | "ok"
  | "invalid_duration"
  | "duration_too_short"
  | "duration_too_long"
  | "not_enough_samples"
  | "low_sample_rate"
  | "static_signal";

export type GaitCaptureQuality = {
  usable: boolean;
  issue: GaitCaptureIssue;
  durationSeconds: number;
  validSampleCount: number;
  sampleRateHz: number;
  signalRange: number;
};

export function validMotionSamples(samples: MotionSample[]): MotionSample[] {
  return samples
    .filter(isValidSample)
    .sort((a, b) => a.timestampMs - b.timestampMs);
}

export function validateGaitCapture(input: {
  samples: MotionSample[];
  durationSeconds: number;
}): GaitCaptureQuality {
  const samples = validMotionSamples(input.samples);
  const durationSeconds = input.durationSeconds;
  const sampleRateHz = estimateSampleRateHz(samples);
  const signalRange = accelerationSignalRange(samples);

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return quality("invalid_duration", durationSeconds, samples, sampleRateHz, signalRange);
  }

  if (durationSeconds < gaitProtocol.minDurationSeconds) {
    return quality("duration_too_short", durationSeconds, samples, sampleRateHz, signalRange);
  }

  if (durationSeconds > gaitProtocol.maxDurationSeconds) {
    return quality("duration_too_long", durationSeconds, samples, sampleRateHz, signalRange);
  }

  if (samples.length < gaitProtocol.minValidSamples) {
    return quality("not_enough_samples", durationSeconds, samples, sampleRateHz, signalRange);
  }

  if (sampleRateHz < gaitProtocol.minSampleRateHz) {
    return quality("low_sample_rate", durationSeconds, samples, sampleRateHz, signalRange);
  }

  if (signalRange < gaitProtocol.minSignalRange) {
    return quality("static_signal", durationSeconds, samples, sampleRateHz, signalRange);
  }

  return quality("ok", durationSeconds, samples, sampleRateHz, signalRange);
}

export function accelerationMagnitude(sample: MotionSample): number {
  return Math.hypot(
    sample.accelerationX,
    sample.accelerationY,
    sample.accelerationZ,
  );
}

export function estimateSampleRateHz(samples: MotionSample[]): number {
  if (samples.length < 2) return 0;
  const first = samples[0].timestampMs;
  const last = samples[samples.length - 1].timestampMs;
  const spanSeconds = (last - first) / 1000;
  if (spanSeconds <= 0) return 0;
  return (samples.length - 1) / spanSeconds;
}

export function accelerationSignalRange(samples: MotionSample[]): number {
  if (samples.length === 0) return 0;
  const magnitudes = samples.map(accelerationMagnitude);
  return Math.max(...magnitudes) - Math.min(...magnitudes);
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

export function coefficientOfVariation(values: number[]): number {
  const average = mean(values);
  if (average === 0) return 1;
  return standardDeviation(values) / Math.abs(average);
}

export function rms(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.sqrt(mean(values.map((value) => value ** 2)));
}

export function movingAverage(values: number[], radius: number): number[] {
  return values.map((_, index) => {
    const start = Math.max(0, index - radius);
    const end = Math.min(values.length, index + radius + 1);
    return mean(values.slice(start, end));
  });
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number(value.toFixed(2))));
}

function isValidSample(sample: MotionSample): boolean {
  return (
    Number.isFinite(sample.timestampMs) &&
    Number.isFinite(sample.accelerationX) &&
    Number.isFinite(sample.accelerationY) &&
    Number.isFinite(sample.accelerationZ)
  );
}

function quality(
  issue: GaitCaptureIssue,
  durationSeconds: number,
  samples: MotionSample[],
  sampleRateHz: number,
  signalRange: number,
): GaitCaptureQuality {
  return {
    usable: issue === "ok",
    issue,
    durationSeconds,
    validSampleCount: samples.length,
    sampleRateHz: Number(sampleRateHz.toFixed(1)),
    signalRange: Number(signalRange.toFixed(2)),
  };
}
```

- [ ] **Step 4: Run protocol tests to verify they pass**

Run:

```bash
bun test tests/unit/gait-protocol.test.ts
```

Expected: `PASS`.

- [ ] **Step 5: Commit protocol work**

Run:

```bash
git add src/lib/sensors/gait-protocol.ts tests/unit/gait-protocol.test.ts
git commit -m "feat: add gait protocol validation"
```

## Task 2: Gait Cycle Detection

**Files:**
- Create: `tests/unit/gait-cycle.test.ts`
- Create: `src/lib/sensors/gait-cycle.ts`

- [ ] **Step 1: Write failing cycle detection tests**

Create `tests/unit/gait-cycle.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import {
  detectGaitCycles,
  stepIntervalsSeconds,
} from "../../src/lib/sensors/gait-cycle";
import type { MotionSample } from "../../src/types/motion";

function walkingSamples(seconds: number, hz = 50, stepHz = 2): MotionSample[] {
  return Array.from({ length: Math.floor(seconds * hz) }, (_, index) => {
    const t = index / hz;
    const phase = 2 * Math.PI * stepHz * t;
    return {
      timestampMs: t * 1000,
      accelerationX: Math.sin(phase) * 0.55,
      accelerationY: Math.cos(phase) * 0.25,
      accelerationZ: 9.81 + Math.sin(phase) * 1.1,
      rotationAlpha: Math.sin(phase) * 8,
      rotationBeta: Math.cos(phase) * 5,
      rotationGamma: Math.sin(phase) * 3,
    };
  });
}

describe("detectGaitCycles", () => {
  test("detects regular steps from a 25 second synthetic walk", () => {
    const result = detectGaitCycles(walkingSamples(25));

    expect(result.steps.length).toBeGreaterThanOrEqual(45);
    expect(result.steps.length).toBeLessThanOrEqual(55);
    expect(result.stepIntervalsSeconds.length).toBe(result.steps.length - 1);
    expect(result.stepIntervalsSeconds[0]).toBeGreaterThan(0.45);
    expect(result.stepIntervalsSeconds[0]).toBeLessThan(0.55);
  });

  test("does not double count high-frequency noise as steps", () => {
    const result = detectGaitCycles(walkingSamples(25, 50, 5));

    expect(result.steps.length).toBeLessThanOrEqual(84);
    expect(Math.min(...result.stepIntervalsSeconds)).toBeGreaterThanOrEqual(0.3);
  });
});

describe("stepIntervalsSeconds", () => {
  test("returns intervals between detected step timestamps", () => {
    expect(
      stepIntervalsSeconds([
        { timestampMs: 1000, amplitude: 1 },
        { timestampMs: 1500, amplitude: 1 },
        { timestampMs: 2050, amplitude: 1 },
      ]),
    ).toEqual([0.5, 0.55]);
  });
});
```

- [ ] **Step 2: Run cycle tests to verify they fail**

Run:

```bash
bun test tests/unit/gait-cycle.test.ts
```

Expected: `FAIL` because `src/lib/sensors/gait-cycle.ts` does not exist.

- [ ] **Step 3: Implement gait cycle detection**

Create `src/lib/sensors/gait-cycle.ts`:

```ts
import type { MotionSample } from "@/types/motion";
import {
  accelerationMagnitude,
  estimateSampleRateHz,
  gaitProtocol,
  mean,
  movingAverage,
  standardDeviation,
  validMotionSamples,
} from "@/lib/sensors/gait-protocol";

export type GaitStep = {
  timestampMs: number;
  amplitude: number;
};

export type GaitCycleSummary = {
  steps: GaitStep[];
  stepIntervalsSeconds: number[];
  centeredSignal: number[];
  smoothedSignal: number[];
  sampleRateHz: number;
};

export function detectGaitCycles(samplesInput: MotionSample[]): GaitCycleSummary {
  const samples = validMotionSamples(samplesInput);
  const magnitudes = samples.map(accelerationMagnitude);
  const averageMagnitude = mean(magnitudes);
  const centeredSignal = magnitudes.map((value) => value - averageMagnitude);
  const smoothedSignal = movingAverage(centeredSignal, 2);
  const threshold = Math.max(0.12, standardDeviation(smoothedSignal) * 0.45);
  const steps = detectStepPeaks(samples, smoothedSignal, threshold);

  return {
    steps,
    stepIntervalsSeconds: stepIntervalsSeconds(steps),
    centeredSignal,
    smoothedSignal,
    sampleRateHz: estimateSampleRateHz(samples),
  };
}

export function stepIntervalsSeconds(steps: GaitStep[]): number[] {
  return steps
    .slice(1)
    .map((step, index) => (step.timestampMs - steps[index].timestampMs) / 1000)
    .filter(
      (interval) =>
        interval >= gaitProtocol.minimumStepIntervalSeconds &&
        interval <= gaitProtocol.maximumStepIntervalSeconds,
    );
}

function detectStepPeaks(
  samples: MotionSample[],
  signal: number[],
  threshold: number,
): GaitStep[] {
  const peaks: GaitStep[] = [];
  const minimumStepIntervalMs = gaitProtocol.minimumStepIntervalSeconds * 1000;

  for (let index = 1; index < signal.length - 1; index += 1) {
    const value = signal[index];
    if (
      value < threshold ||
      value <= signal[index - 1] ||
      value < signal[index + 1]
    ) {
      continue;
    }

    const peak = {
      amplitude: Math.abs(value),
      timestampMs: samples[index].timestampMs,
    };
    const previousPeak = peaks.at(-1);

    if (
      previousPeak &&
      peak.timestampMs - previousPeak.timestampMs < minimumStepIntervalMs
    ) {
      if (peak.amplitude > previousPeak.amplitude) {
        peaks[peaks.length - 1] = peak;
      }
      continue;
    }

    peaks.push(peak);
  }

  return peaks;
}
```

- [ ] **Step 4: Run cycle tests to verify they pass**

Run:

```bash
bun test tests/unit/gait-cycle.test.ts
```

Expected: `PASS`.

- [ ] **Step 5: Commit cycle detection work**

Run:

```bash
git add src/lib/sensors/gait-cycle.ts tests/unit/gait-cycle.test.ts
git commit -m "feat: detect gait cycles from motion samples"
```

## Task 3: Detailed Gait Metrics

**Files:**
- Create: `tests/unit/gait-metrics.test.ts`
- Create: `src/lib/sensors/gait-metrics.ts`

- [ ] **Step 1: Write failing detailed metric tests**

Create `tests/unit/gait-metrics.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { summarizeGaitMetrics } from "../../src/lib/sensors/gait-metrics";
import type { MotionSample } from "../../src/types/motion";

function regularWalk(seconds: number, hz = 50, stepHz = 2): MotionSample[] {
  return Array.from({ length: Math.floor(seconds * hz) }, (_, index) => {
    const t = index / hz;
    const phase = 2 * Math.PI * stepHz * t;
    return {
      timestampMs: t * 1000,
      accelerationX: Math.sin(phase) * 0.55,
      accelerationY: Math.cos(phase) * 0.25,
      accelerationZ: 9.81 + Math.sin(phase) * 1.1,
      rotationAlpha: Math.sin(phase) * 8,
      rotationBeta: Math.cos(phase) * 5,
      rotationGamma: Math.sin(phase) * 3,
    };
  });
}

function irregularWalk(): MotionSample[] {
  const samples: MotionSample[] = [];
  let timestampMs = 0;
  const intervalsMs = [420, 720, 380, 850, 500, 680, 460, 900];

  for (let step = 0; timestampMs < 25_000; step += 1) {
    const intervalMs = intervalsMs[step % intervalsMs.length];
    const nextStepMs = timestampMs + intervalMs;
    while (timestampMs < nextStepMs && timestampMs < 25_000) {
      const phase = ((timestampMs % intervalMs) / intervalMs) * 2 * Math.PI;
      samples.push({
        timestampMs,
        accelerationX: Math.sin(phase) * 0.5,
        accelerationY: Math.cos(phase) * 0.25,
        accelerationZ: 9.81 + Math.sin(phase) * 1.05,
        rotationAlpha: Math.sin(phase) * 7,
        rotationBeta: Math.cos(phase) * 5,
        rotationGamma: Math.sin(phase) * 3,
      });
      timestampMs += 20;
    }
  }

  return samples;
}

describe("summarizeGaitMetrics", () => {
  test("summarizes a regular 25 second walk", () => {
    const metrics = summarizeGaitMetrics({
      durationSeconds: 25,
      samples: regularWalk(25),
      stepLengthMeters: 0.68,
    });

    expect(metrics.completionStatus).toBe("completed");
    expect(metrics.stepCount).toBeGreaterThanOrEqual(45);
    expect(metrics.stepCount).toBeLessThanOrEqual(55);
    expect(metrics.cadenceStepsPerMinute).toBeGreaterThanOrEqual(108);
    expect(metrics.cadenceStepsPerMinute).toBeLessThanOrEqual(132);
    expect(metrics.rhythmConsistency).toBeGreaterThan(0.8);
    expect(metrics.stabilityScore).toBeGreaterThan(0.55);
    expect(metrics.cycleQualityScore).toBeGreaterThan(0.75);
    expect(metrics.gaitSpeedEstimateSource).toBe("estimated_step_length");
    expect(metrics.estimatedGaitSpeedMetersPerSecond).toBeGreaterThan(1);
  });

  test("scores irregular step timing lower than regular timing", () => {
    const regular = summarizeGaitMetrics({
      durationSeconds: 25,
      samples: regularWalk(25),
      stepLengthMeters: 0.68,
    });
    const irregular = summarizeGaitMetrics({
      durationSeconds: 25,
      samples: irregularWalk(),
      stepLengthMeters: 0.68,
    });

    expect(irregular.completionStatus).toBe("completed");
    expect(irregular.rhythmConsistency).toBeLessThan(regular.rhythmConsistency);
  });

  test("uses explicit course distance over estimated step length for speed", () => {
    const metrics = summarizeGaitMetrics({
      distanceMeters: 20,
      durationSeconds: 25,
      samples: regularWalk(25),
      stepLengthMeters: 0.68,
    });

    expect(metrics.gaitSpeedMetersPerSecond).toBe(0.8);
    expect(metrics.gaitSpeedEstimateSource).toBe("course_distance");
  });

  test("returns stopped metrics for unusable captures", () => {
    const metrics = summarizeGaitMetrics({
      durationSeconds: 10,
      samples: regularWalk(10),
      stepLengthMeters: 0.68,
    });

    expect(metrics.completionStatus).toBe("stopped");
    expect(metrics.stepCount).toBe(0);
    expect(metrics.stabilityScore).toBe(0);
    expect(metrics.rhythmConsistency).toBe(0);
  });
});
```

- [ ] **Step 2: Run detailed metric tests to verify they fail**

Run:

```bash
bun test tests/unit/gait-metrics.test.ts
```

Expected: `FAIL` because `src/lib/sensors/gait-metrics.ts` does not exist.

- [ ] **Step 3: Implement detailed gait metrics**

Create `src/lib/sensors/gait-metrics.ts`:

```ts
import { detectGaitCycles, type GaitStep } from "@/lib/sensors/gait-cycle";
import {
  clamp01,
  coefficientOfVariation,
  gaitProtocol,
  mean,
  rms,
  validMotionSamples,
  validateGaitCapture,
} from "@/lib/sensors/gait-protocol";
import type { MotionSample } from "@/types/motion";

export type GaitSpeedEstimateSource =
  | "course_distance"
  | "estimated_step_length";

export type DetailedGaitMetrics = {
  completionStatus: "completed" | "stopped";
  source: "accelerometer";
  stabilityScore: number;
  rhythmConsistency: number;
  stepCount: number;
  cadenceStepsPerMinute?: number;
  stepTimeMeanSeconds?: number;
  stepTimeVariability?: number;
  jerkVariability: number;
  rotationVariability: number;
  cycleQualityScore: number;
  gaitSpeedMetersPerSecond?: number;
  estimatedGaitSpeedMetersPerSecond?: number;
  gaitSpeedEstimateSource?: GaitSpeedEstimateSource;
};

export function summarizeGaitMetrics(input: {
  samples: MotionSample[];
  durationSeconds: number;
  distanceMeters?: number;
  stepLengthMeters?: number;
}): DetailedGaitMetrics {
  const samples = validMotionSamples(input.samples);
  const quality = validateGaitCapture({
    durationSeconds: input.durationSeconds,
    samples,
  });

  if (!quality.usable) {
    return stoppedMetrics();
  }

  const cycles = detectGaitCycles(samples);
  if (cycles.steps.length < gaitProtocol.minDetectedSteps) {
    return stoppedMetrics();
  }

  const intervals = cycles.stepIntervalsSeconds;
  const stepTimeMeanSeconds = Number(mean(intervals).toFixed(2));
  const stepTimeVariability = clamp01(coefficientOfVariation(intervals));
  const rhythmConsistency = scoreRhythmConsistency(intervals);
  const jerkVariability = scoreJerkVariability(samples, cycles.smoothedSignal);
  const rotationVariability = scoreRotationVariability(samples);
  const stabilityScore = scoreStability({
    jerkVariability,
    rotationVariability,
    steps: cycles.steps,
  });
  const speed = speedMetrics({
    distanceMeters: input.distanceMeters,
    durationSeconds: input.durationSeconds,
    stepCount: cycles.steps.length,
    stepLengthMeters: input.stepLengthMeters,
  });

  return {
    completionStatus: "completed",
    source: "accelerometer",
    stabilityScore,
    rhythmConsistency,
    stepCount: cycles.steps.length,
    cadenceStepsPerMinute: Number(
      ((cycles.steps.length / input.durationSeconds) * 60).toFixed(1),
    ),
    stepTimeMeanSeconds,
    stepTimeVariability,
    jerkVariability,
    rotationVariability,
    cycleQualityScore: scoreCycleQuality({
      detectedSteps: cycles.steps.length,
      durationSeconds: input.durationSeconds,
      rhythmConsistency,
      sampleRateHz: cycles.sampleRateHz,
    }),
    ...speed,
  };
}

function stoppedMetrics(): DetailedGaitMetrics {
  return {
    completionStatus: "stopped",
    source: "accelerometer",
    stabilityScore: 0,
    rhythmConsistency: 0,
    stepCount: 0,
    jerkVariability: 1,
    rotationVariability: 1,
    cycleQualityScore: 0,
  };
}

function scoreRhythmConsistency(intervals: number[]): number {
  if (intervals.length < 2) return 0;
  const intervalVariation = coefficientOfVariation(intervals);
  const averageInterval = mean(intervals);
  const stepFrequencyHz = averageInterval > 0 ? 1 / averageInterval : 0;
  const cadencePenalty =
    stepFrequencyHz < 0.7 || stepFrequencyHz > 3 ? 0.2 : 0;

  return clamp01(1 - intervalVariation / 0.35 - cadencePenalty);
}

function scoreJerkVariability(
  samples: MotionSample[],
  smoothedSignal: number[],
): number {
  const jerkValues: number[] = [];

  for (let index = 1; index < smoothedSignal.length; index += 1) {
    const seconds =
      (samples[index].timestampMs - samples[index - 1].timestampMs) / 1000;
    if (seconds > 0) {
      jerkValues.push(Math.abs((smoothedSignal[index] - smoothedSignal[index - 1]) / seconds));
    }
  }

  return clamp01(rms(jerkValues) / 90);
}

function scoreRotationVariability(samples: MotionSample[]): number {
  const rotationMagnitudes = samples
    .map((sample) =>
      Math.hypot(
        sample.rotationAlpha ?? 0,
        sample.rotationBeta ?? 0,
        sample.rotationGamma ?? 0,
      ),
    )
    .filter((value) => value > 0);

  return clamp01(rms(rotationMagnitudes) / 160);
}

function scoreStability(input: {
  jerkVariability: number;
  rotationVariability: number;
  steps: GaitStep[];
}): number {
  const amplitudePenalty =
    input.steps.length >= 3
      ? clamp01(coefficientOfVariation(input.steps.map((step) => step.amplitude)) / 0.8)
      : 0.35;

  return clamp01(
    1 -
      (amplitudePenalty * 0.35 +
        input.rotationVariability * 0.25 +
        input.jerkVariability * 0.25),
  );
}

function scoreCycleQuality(input: {
  detectedSteps: number;
  durationSeconds: number;
  rhythmConsistency: number;
  sampleRateHz: number;
}): number {
  const expectedMinimumSteps = Math.max(
    gaitProtocol.minDetectedSteps,
    input.durationSeconds * 0.7,
  );
  const stepCoverage = clamp01(input.detectedSteps / expectedMinimumSteps);
  const sampleRateCoverage = clamp01(input.sampleRateHz / 50);

  return clamp01(
    stepCoverage * 0.35 +
      input.rhythmConsistency * 0.4 +
      sampleRateCoverage * 0.25,
  );
}

function speedMetrics(input: {
  distanceMeters?: number;
  durationSeconds: number;
  stepCount: number;
  stepLengthMeters?: number;
}): Pick<
  DetailedGaitMetrics,
  | "gaitSpeedMetersPerSecond"
  | "estimatedGaitSpeedMetersPerSecond"
  | "gaitSpeedEstimateSource"
> {
  if (
    input.distanceMeters !== undefined &&
    input.distanceMeters > 0 &&
    input.durationSeconds > 0
  ) {
    return {
      gaitSpeedMetersPerSecond: Number(
        (input.distanceMeters / input.durationSeconds).toFixed(2),
      ),
      gaitSpeedEstimateSource: "course_distance",
    };
  }

  if (
    input.stepLengthMeters !== undefined &&
    input.stepLengthMeters > 0 &&
    input.stepCount > 0 &&
    input.durationSeconds > 0
  ) {
    const estimated = Number(
      ((input.stepCount * input.stepLengthMeters) / input.durationSeconds).toFixed(2),
    );
    return {
      gaitSpeedMetersPerSecond: estimated,
      estimatedGaitSpeedMetersPerSecond: estimated,
      gaitSpeedEstimateSource: "estimated_step_length",
    };
  }

  return {};
}
```

- [ ] **Step 4: Run detailed metric tests to verify they pass**

Run:

```bash
bun test tests/unit/gait-metrics.test.ts
```

Expected: `PASS`.

- [ ] **Step 5: Commit detailed metric work**

Run:

```bash
git add src/lib/sensors/gait-metrics.ts tests/unit/gait-metrics.test.ts
git commit -m "feat: summarize detailed gait metrics"
```

## Task 4: MotionMetrics Contract And Summary Facade

**Files:**
- Modify: `src/types/assessment.ts`
- Modify: `src/lib/sensors/motion-summary.ts`
- Create: `tests/unit/motion-summary.test.ts`

- [ ] **Step 1: Write failing motion summary tests**

Create `tests/unit/motion-summary.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import {
  getUnavailableMotionMetrics,
  summarizeMotionSamples,
} from "../../src/lib/sensors/motion-summary";
import type { MotionSample } from "../../src/types/motion";

function regularWalk(seconds: number, hz = 50): MotionSample[] {
  return Array.from({ length: Math.floor(seconds * hz) }, (_, index) => {
    const t = index / hz;
    const phase = 2 * Math.PI * 2 * t;
    return {
      timestampMs: t * 1000,
      accelerationX: Math.sin(phase) * 0.55,
      accelerationY: Math.cos(phase) * 0.25,
      accelerationZ: 9.81 + Math.sin(phase) * 1.1,
      rotationAlpha: Math.sin(phase) * 8,
      rotationBeta: Math.cos(phase) * 5,
      rotationGamma: Math.sin(phase) * 3,
    };
  });
}

describe("summarizeMotionSamples", () => {
  test("maps detailed gait metrics onto MotionMetrics", () => {
    const metrics = summarizeMotionSamples({
      durationSeconds: 25,
      samples: regularWalk(25),
      stepLengthMeters: 0.68,
    });

    expect(metrics.completionStatus).toBe("completed");
    expect(metrics.source).toBe("accelerometer");
    expect(metrics.stepCount).toBeGreaterThanOrEqual(45);
    expect(metrics.cadenceStepsPerMinute).toBeGreaterThan(100);
    expect(metrics.rhythmConsistency).toBeGreaterThan(0.8);
    expect(metrics.stabilityScore).toBeGreaterThan(0.55);
    expect(metrics.gaitSpeedEstimateSource).toBe("estimated_step_length");
    expect(metrics.estimatedGaitSpeedMetersPerSecond).toBe(
      metrics.gaitSpeedMetersPerSecond,
    );
  });

  test("uses explicit distance as the gait speed source when provided", () => {
    const metrics = summarizeMotionSamples({
      distanceMeters: 20,
      durationSeconds: 25,
      samples: regularWalk(25),
      stepLengthMeters: 0.68,
    });

    expect(metrics.gaitSpeedMetersPerSecond).toBe(0.8);
    expect(metrics.gaitSpeedEstimateSource).toBe("course_distance");
  });

  test("does not fabricate passing metrics when no samples are captured", () => {
    const metrics = summarizeMotionSamples({
      durationSeconds: 25,
      samples: [],
      stepLengthMeters: 0.68,
    });

    expect(metrics).toEqual(getUnavailableMotionMetrics("accelerometer"));
  });
});
```

- [ ] **Step 2: Run motion summary tests to verify they fail**

Run:

```bash
bun test tests/unit/motion-summary.test.ts
```

Expected: `FAIL` because `MotionMetrics` does not yet include detailed gait fields and `summarizeMotionSamples` does not accept `stepLengthMeters`.

- [ ] **Step 3: Expand the MotionMetrics type**

In `src/types/assessment.ts`, replace the existing `MotionMetrics` type with:

```ts
export type MotionMetrics = {
  stabilityScore: number;
  rhythmConsistency: number;
  gaitSpeedMetersPerSecond?: number;
  estimatedGaitSpeedMetersPerSecond?: number;
  gaitSpeedEstimateSource?: "course_distance" | "estimated_step_length";
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

- [ ] **Step 4: Replace motion summary implementation**

Replace `src/lib/sensors/motion-summary.ts` with:

```ts
import { summarizeGaitMetrics } from "@/lib/sensors/gait-metrics";
import type { MotionMetrics } from "@/types/assessment";
import type { MotionSample } from "@/types/motion";

export function getDemoMotionMetrics(): MotionMetrics {
  return {
    stabilityScore: 0.62,
    rhythmConsistency: 0.58,
    gaitSpeedMetersPerSecond: 0.82,
    completionStatus: "demo",
    source: "demo",
  };
}

export function getUnavailableMotionMetrics(
  source: "accelerometer" | "manual" = "manual",
): MotionMetrics {
  return {
    stabilityScore: 0,
    rhythmConsistency: 0,
    completionStatus: "stopped",
    source,
  };
}

export function summarizeMotionSamples(input: {
  samples: MotionSample[];
  distanceMeters?: number;
  durationSeconds: number;
  stepLengthMeters?: number;
}): MotionMetrics {
  const metrics = summarizeGaitMetrics(input);

  if (metrics.completionStatus === "stopped") {
    return getUnavailableMotionMetrics("accelerometer");
  }

  return {
    stabilityScore: metrics.stabilityScore,
    rhythmConsistency: metrics.rhythmConsistency,
    gaitSpeedMetersPerSecond: metrics.gaitSpeedMetersPerSecond,
    estimatedGaitSpeedMetersPerSecond:
      metrics.estimatedGaitSpeedMetersPerSecond,
    gaitSpeedEstimateSource: metrics.gaitSpeedEstimateSource,
    stepCount: metrics.stepCount,
    cadenceStepsPerMinute: metrics.cadenceStepsPerMinute,
    stepTimeMeanSeconds: metrics.stepTimeMeanSeconds,
    stepTimeVariability: metrics.stepTimeVariability,
    jerkVariability: metrics.jerkVariability,
    rotationVariability: metrics.rotationVariability,
    cycleQualityScore: metrics.cycleQualityScore,
    completionStatus: "completed",
    source: "accelerometer",
  };
}
```

- [ ] **Step 5: Run motion summary tests to verify they pass**

Run:

```bash
bun test tests/unit/motion-summary.test.ts
```

Expected: `PASS`.

- [ ] **Step 6: Run all sensor unit tests touched so far**

Run:

```bash
bun test tests/unit/gait-protocol.test.ts tests/unit/gait-cycle.test.ts tests/unit/gait-metrics.test.ts tests/unit/motion-summary.test.ts tests/unit/accelerometer.test.ts
```

Expected: `PASS`.

- [ ] **Step 7: Commit contract and summary facade work**

Run:

```bash
git add src/types/assessment.ts src/lib/sensors/motion-summary.ts tests/unit/motion-summary.test.ts
git commit -m "feat: expose detailed gait motion metrics"
```

## Task 5: Timed Pocket Walk UI Wiring

**Files:**
- Modify: `src/components/assessment/useAssessmentFlow.ts`
- Modify: `src/components/assessment/screens/GaitScreen.tsx`

- [ ] **Step 1: Update the gait action signature**

In `src/components/assessment/useAssessmentFlow.ts`, replace the current `startGaitCountdown` function with:

```ts
  /**
   * Fires when the guided walk finishes. Uses real devicemotion samples
   * captured during the active 25 second pocket walk. Missing or unusable
   * samples produce a stopped/unavailable gait result so the flow keeps its
   * safety gate instead of fabricating a passing sensor result.
   */
  function startGaitCountdown(
    samples: MotionSample[] = [],
    elapsedSeconds = 0,
    stepLengthMeters?: number,
  ) {
    setMotion(
      summarizeMotionSamples({
        samples,
        durationSeconds: elapsedSeconds,
        stepLengthMeters,
      }),
    );
  }
```

- [ ] **Step 2: Replace the guided gait screen with timed capture**

Replace `src/components/assessment/screens/GaitScreen.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { GaitWalkDemo } from "@/components/assessment/demos/GaitWalkDemo";
import { MotionSensorStatus } from "@/components/assessment/MotionSensorStatus";
import { TestStartPanel } from "@/components/assessment/TestStartPanel";
import { FormGrid, TextField } from "@/components/assessment/ui/Fields";
import { permissionLabel } from "@/components/assessment/ui/permission-labels";
import { SafetyCallout } from "@/components/assessment/ui/SafetyCallout";
import { ScreenHeader } from "@/components/assessment/ui/ScreenHeader";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { gaitProtocol } from "@/lib/sensors/gait-protocol";
import { getDemoMotionMetrics } from "@/lib/sensors/motion-summary";
import {
  DEFAULT_HEIGHT_METERS,
  estimateStepLengthMeters,
} from "@/lib/sensors/step-detection";
import type { AssessmentFlow } from "@/components/assessment/useAssessmentFlow";
import type { MotionSupportStatus } from "@/types/motion";

function formatOptionalNumber(value: number | undefined, suffix: string) {
  return value === undefined ? "—" : `${value}${suffix}`;
}

export function GaitScreen({ flow }: { flow: AssessmentFlow }) {
  const {
    gaitPhase,
    setGaitPhase,
    motion,
    setMotion,
    chairStandGate,
    motionGate,
    markGaitStoppedOrUnstable,
    startGaitCountdown,
  } = flow;
  const { profile } = useUserProfile();
  const [motionStatus, setMotionStatus] = useState<MotionSupportStatus>();
  const heightCm = profile?.heightCm ?? Math.round(DEFAULT_HEIGHT_METERS * 100);
  const stepLengthMeters = estimateStepLengthMeters(heightCm / 100);

  if (gaitPhase === "demo") {
    return <GaitWalkDemo onContinue={() => setGaitPhase("start")} />;
  }

  if (gaitPhase === "start") {
    return (
      <TestStartPanel
        autoCompleteSeconds={gaitProtocol.targetDurationSeconds}
        countdownCueWord="go"
        fallbackActions={[
          {
            label: "Enter manually",
            onClick: () => setGaitPhase("manual"),
          },
          {
            label: "Mark stopped or unstable",
            onClick: markGaitStoppedOrUnstable,
          },
        ]}
        guidedPocketMode
        onPrimary={(samples, elapsedSeconds) =>
          startGaitCountdown(samples, elapsedSeconds, stepLengthMeters)
        }
        primaryLabel="Start 25 sec walk"
        resultItems={[
          {
            label: "Gait speed",
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
            value: String(motion.stepCount ?? "—"),
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
        ]}
        safetyInstruction="Walk at your usual safe pace for 25 seconds with the phone placed in a front pocket."
        showMotionReadout
        statusItems={[
          {
            label: "Motion",
            value: permissionLabel(motionStatus?.permissionState),
          },
          {
            label: "Duration",
            value: `${gaitProtocol.targetDurationSeconds}s`,
          },
          {
            label: "Speed",
            value:
              motion.gaitSpeedEstimateSource === "course_distance"
                ? "Course distance"
                : "Step estimate",
          },
        ]}
        title="Gait walk test"
      >
        {!chairStandGate.canProceed && (
          <SafetyCallout tone="danger">
            Chair stand screening suggests this participant should not continue
            to gait walking today. Higher-risk testing will be skipped.
          </SafetyCallout>
        )}
        <MotionSensorStatus onStatusChange={setMotionStatus} />
      </TestStartPanel>
    );
  }

  return (
    <section className="grid gap-6">
      <ScreenHeader
        support="Use this fallback if motion sensing is denied or unavailable."
        title="Enter gait walk result"
      />
      <MotionSensorStatus />
      <FormGrid>
        <TextField
          label="Gait speed in metres per second"
          onChange={(value) =>
            setMotion((current) => ({
              ...current,
              gaitSpeedMetersPerSecond: Number(value),
              completionStatus: "completed",
              source: "manual",
            }))
          }
          type="number"
          value={String(motion.gaitSpeedMetersPerSecond ?? 0)}
        />
        <TextField
          label="Stability score"
          onChange={(value) =>
            setMotion((current) => ({
              ...current,
              stabilityScore: Number(value),
              completionStatus: "completed",
              source: "manual",
            }))
          }
          type="number"
          value={String(motion.stabilityScore)}
        />
      </FormGrid>
      <div className="flex flex-wrap gap-3">
        <button
          className="secondary-action"
          onClick={() => setGaitPhase("start")}
          type="button"
        >
          Back to guided start
        </button>
        <button
          className="secondary-action"
          onClick={() => setMotion(getDemoMotionMetrics())}
          type="button"
        >
          Use demo gait walk
        </button>
        <button
          className="secondary-action"
          onClick={markGaitStoppedOrUnstable}
          type="button"
        >
          Mark stopped or unstable
        </button>
      </div>
      {!motionGate.canProceed && (
        <SafetyCallout tone="danger">
          Gait walking suggests caution. The floor-rising test is the
          highest-risk test and should not be attempted in this flow.
        </SafetyCallout>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Run TypeScript-facing verification for UI wiring**

Run:

```bash
npm run lint
```

Expected: `PASS`.

- [ ] **Step 4: Run a production build**

Run:

```bash
npm run build
```

Expected: `PASS`.

- [ ] **Step 5: Commit timed gait UI wiring**

Run:

```bash
git add src/components/assessment/useAssessmentFlow.ts src/components/assessment/screens/GaitScreen.tsx
git commit -m "feat: switch gait test to timed pocket walk"
```

## Task 6: Final Regression And Manual QA Notes

**Files:**
- Modify: no implementation files

- [ ] **Step 1: Run all unit tests**

Run:

```bash
bun test tests/unit/accelerometer.test.ts tests/unit/gait-protocol.test.ts tests/unit/gait-cycle.test.ts tests/unit/gait-metrics.test.ts tests/unit/motion-summary.test.ts
```

Expected: `PASS`.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: `PASS`.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: `PASS`.

- [ ] **Step 4: Manual verification on desktop fallback path**

Run:

```bash
npm run dev
```

Expected: local server starts. In a desktop browser, walk through the Mr Tan demo path, open gait walking, deny or lack motion support, use manual or demo fallback, and confirm the assessment can still reach the result screen. Stop the dev server after verification.

- [ ] **Step 5: Manual verification on mobile HTTPS path**

Use the Vercel HTTPS deployment on iPhone Safari or Android Chrome. Confirm:

- Motion permission is requested from the start tap.
- The pocket-placement cue appears before active capture.
- Active capture auto-stops at 25 seconds.
- Permission denial leaves manual/demo/stopped options available.
- A stopped or unstable gait result keeps floor-rising locked or skipped.
- Saved assessment stores derived motion metrics only.

- [ ] **Step 6: Commit QA notes if a markdown note is added**

If the implementation adds a manual QA note file under `docs/`, run:

```bash
git add docs
git commit -m "docs: record gait verification notes"
```

If no QA note file is added, do not create a documentation-only commit for this task.

## Completion Criteria

- `bun test tests/unit/accelerometer.test.ts tests/unit/gait-protocol.test.ts tests/unit/gait-cycle.test.ts tests/unit/gait-metrics.test.ts tests/unit/motion-summary.test.ts` passes.
- `npm run lint` passes.
- `npm run build` passes.
- Guided gait uses a 25 second timed pocket walk.
- Automatic no-sample or low-quality captures do not produce a passing gait result.
- Manual, demo, and stopped fallbacks remain available.
- Unsafe or stopped gait still blocks floor-rising.
- No raw IMU sample storage is introduced.
- No production dependency is added.
- No diagnosis, prescription, regulatory, or clinical-validation claim is added.
