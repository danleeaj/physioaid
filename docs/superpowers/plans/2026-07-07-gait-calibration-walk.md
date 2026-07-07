# Session-Only Gait Calibration Walk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional measured-distance gait calibration walk that is scoped to the current gait screen session and labels the next timed gait estimate as calibration-based.

**Architecture:** Add a pure calibration analyzer under `src/lib/sensors/`, extend the existing gait estimate-method plumbing to distinguish calibrated step length from height-regression step length, and keep `GaitScreen` as the only owner of accepted calibration state. Reuse `TestStartPanel` for capture; do not add profile fields, draft persistence, Firestore writes, localStorage writes, raw sensor storage, or assessment-history schema changes.

**Tech Stack:** TypeScript, React/Next.js, Bun test runner, browser DeviceMotion samples, existing gait-cycle and reconstruction helpers.

---

## File Structure

Create:

- `src/lib/sensors/gait-calibration.ts`  
  Pure measured-distance calibration analyzer, result types, quality rules, and helper for preserving current session calibration after rejected retries.
- `tests/unit/gait-calibration.test.ts`  
  Synthetic calibration capture tests for distance validation, phone-removal tail trimming, clean-finish rejection, implausible step length, and rejected retry behavior.

Modify:

- `src/types/assessment.ts`  
  Add `"calibration_walk"` to `MotionMetrics.absoluteEstimateMethod`.
- `src/lib/sensors/gait-reconstruction/parameters.ts`  
  Add calibrated step-length labeling to absolute estimate selection.
- `src/lib/sensors/gait-reconstruction/analyze.ts`  
  Thread the step-length estimate method through reconstruction summaries.
- `src/lib/sensors/motion-summary.ts`  
  Accept and pass a calibrated step-length estimate method into reconstruction.
- `src/components/assessment/screens/gait-display.ts`  
  Display `Calibration walk` / `Calibration speed` labels.
- `src/components/assessment/screens/GaitScreen.tsx`  
  Add current-screen calibration state, setup/capture/result UI, and calibrated step-length handoff to normal timed gait.
- `src/components/assessment/useAssessmentFlow.ts`  
  Allow `startGaitCountdown` to receive a step-length estimate method.
- `tests/unit/motion-summary.test.ts`  
  Assert calibrated step length produces `absoluteEstimateMethod: "calibration_walk"`.
- `tests/unit/gait-display.test.ts`  
  Assert calibration labels.

Do not modify:

- `src/types/profile.ts`
- `src/components/auth/UserProfileProvider.tsx`
- `src/lib/user-profile/**`
- `src/lib/demo/profile/**`
- `src/lib/assessment/session-draft.ts`
- `src/lib/vision/**`
- `src/config/**`
- `src/content/**`

---

## Task 1: Estimate Method Contract

**Files:**

- Modify: `src/types/assessment.ts`
- Modify: `src/lib/sensors/gait-reconstruction/parameters.ts`
- Modify: `src/lib/sensors/gait-reconstruction/analyze.ts`
- Modify: `src/lib/sensors/motion-summary.ts`
- Modify: `src/components/assessment/screens/gait-display.ts`
- Modify: `tests/unit/motion-summary.test.ts`
- Modify: `tests/unit/gait-display.test.ts`

- [ ] **Step 1: Add failing motion-summary coverage**

Append this test inside `describe("summarizeMotionSamples", ...)` in `tests/unit/motion-summary.test.ts`:

```ts
  test("labels calibrated step length estimates", () => {
    const metrics = summarizeMotionSamples({
      durationSeconds: 25,
      samples: regularWalk(25),
      stepLengthMeters: 0.62,
      stepLengthEstimateMethod: "calibration_walk",
    });

    expect(metrics.completionStatus).toBe("completed");
    expect(metrics.gaitSpeedEstimateSource).toBe("estimated_step_length");
    expect(metrics.absoluteEstimateMethod).toBe("calibration_walk");
  });
```

- [ ] **Step 2: Add failing display-label coverage**

Modify the import in `tests/unit/gait-display.test.ts`:

```ts
import {
  analysisModeLabel,
  gaitSpeedLabel,
  shapeResultItem,
  speedSourceLabel,
} from "../../src/components/assessment/screens/gait-display";
```

Replace the first test in `tests/unit/gait-display.test.ts` with:

```ts
  test("labels speed by estimate source", () => {
    expect(
      gaitSpeedLabel(
        motion({
          absoluteEstimateMethod: "course_distance",
          gaitSpeedMetersPerSecond: 0.8,
        }),
      ),
    ).toBe("Course speed");
    expect(
      gaitSpeedLabel(
        motion({
          absoluteEstimateMethod: "calibration_walk",
          gaitSpeedMetersPerSecond: 0.9,
        }),
      ),
    ).toBe("Calibration speed");
    expect(
      gaitSpeedLabel(
        motion({
          absoluteEstimateMethod: "height_regression",
          gaitSpeedMetersPerSecond: 0.9,
        }),
      ),
    ).toBe("Estimated speed");
    expect(gaitSpeedLabel(motion({}))).toBe("Gait speed");
  });

  test("labels speed source by estimate method", () => {
    expect(
      speedSourceLabel(
        motion({
          absoluteEstimateMethod: "calibration_walk",
        }),
      ),
    ).toBe("Calibration walk");
    expect(
      speedSourceLabel(
        motion({
          absoluteEstimateMethod: "height_regression",
        }),
      ),
    ).toBe("Estimated");
    expect(speedSourceLabel(motion({}))).toBe("Not measured");
  });
```

- [ ] **Step 3: Run the targeted tests and verify they fail**

Run:

```bash
bun test tests/unit/motion-summary.test.ts tests/unit/gait-display.test.ts
```

Expected:

- FAIL because `stepLengthEstimateMethod` is not accepted by `summarizeMotionSamples`.
- FAIL because `"calibration_walk"` is not part of `MotionMetrics.absoluteEstimateMethod`.
- FAIL because `speedSourceLabel()` does not return `Calibration walk`.

- [ ] **Step 4: Extend `MotionMetrics` estimate method**

In `src/types/assessment.ts`, replace the `absoluteEstimateMethod` line with:

```ts
  absoluteEstimateMethod?:
    | "height_regression"
    | "course_distance"
    | "calibration_walk"
    | "none";
```

- [ ] **Step 5: Extend absolute estimate selection**

In `src/lib/sensors/gait-reconstruction/parameters.ts`, replace `AbsoluteEstimateMethod` with:

```ts
export type AbsoluteEstimateMethod =
  | "height_regression"
  | "course_distance"
  | "calibration_walk"
  | "none";
```

Replace `absoluteEstimate()` with:

```ts
export function absoluteEstimate(input: {
  distanceMeters?: number;
  stepLengthMeters?: number;
  stepLengthEstimateMethod?: "height_regression" | "calibration_walk";
}): {
  method: AbsoluteEstimateMethod;
  gaitSpeedEstimateSource?: GaitSpeedEstimateSource;
} {
  if (input.distanceMeters !== undefined && input.distanceMeters > 0) {
    return {
      method: "course_distance",
      gaitSpeedEstimateSource: "course_distance",
    };
  }
  if (input.stepLengthMeters !== undefined && input.stepLengthMeters > 0) {
    return {
      method: input.stepLengthEstimateMethod ?? "height_regression",
      gaitSpeedEstimateSource: "estimated_step_length",
    };
  }
  return { method: "none" };
}
```

- [ ] **Step 6: Thread the method through reconstruction**

In `src/lib/sensors/gait-reconstruction/analyze.ts`, replace `GaitReconstructionInput` with:

```ts
export type GaitReconstructionInput = {
  samples: MotionSample[];
  durationSeconds: number;
  distanceMeters?: number;
  stepLengthMeters?: number;
  stepLengthEstimateMethod?: "height_regression" | "calibration_walk";
};
```

Replace the `absoluteEstimateMethod` type in `GaitReconstructionSummary` with:

```ts
  absoluteEstimateMethod:
    | "height_regression"
    | "course_distance"
    | "calibration_walk"
    | "none";
```

No other code in `analyze.ts` needs branching, because `absoluteEstimate(input)` already receives the full input object.

- [ ] **Step 7: Thread the method through motion summary**

In `src/lib/sensors/motion-summary.ts`, replace the `summarizeMotionSamples` input type with:

```ts
export function summarizeMotionSamples(input: {
  samples: MotionSample[];
  distanceMeters?: number;
  durationSeconds: number;
  stepLengthMeters?: number;
  stepLengthEstimateMethod?: "height_regression" | "calibration_walk";
}): MotionMetrics {
```

Keep this call as-is because `input` now contains the optional method:

```ts
  const metrics = analyzeGaitReconstruction(input);
```

- [ ] **Step 8: Add calibration labels**

In `src/components/assessment/screens/gait-display.ts`, replace `gaitSpeedLabel()` with:

```ts
export function gaitSpeedLabel(motion: MotionMetrics) {
  if (motion.absoluteEstimateMethod === "course_distance") {
    return "Course speed";
  }
  if (motion.absoluteEstimateMethod === "calibration_walk") {
    return "Calibration speed";
  }
  if (motion.gaitSpeedMetersPerSecond !== undefined) {
    return "Estimated speed";
  }
  return "Gait speed";
}
```

Replace `speedSourceLabel()` with:

```ts
export function speedSourceLabel(motion: MotionMetrics) {
  if (motion.absoluteEstimateMethod === "course_distance") {
    return "Course distance";
  }
  if (motion.absoluteEstimateMethod === "calibration_walk") {
    return "Calibration walk";
  }
  if (motion.absoluteEstimateMethod === "height_regression") {
    return "Estimated";
  }
  return "Not measured";
}
```

- [ ] **Step 9: Verify Task 1 tests pass**

Run:

```bash
bun test tests/unit/motion-summary.test.ts tests/unit/gait-display.test.ts
```

Expected:

- PASS for both test files.

- [ ] **Step 10: Commit Task 1**

Run:

```bash
git add src/types/assessment.ts src/lib/sensors/gait-reconstruction/parameters.ts src/lib/sensors/gait-reconstruction/analyze.ts src/lib/sensors/motion-summary.ts src/components/assessment/screens/gait-display.ts tests/unit/motion-summary.test.ts tests/unit/gait-display.test.ts
git commit -m "feat(gait): label calibration walk speed estimates"
```

---

## Task 2: Calibration Analyzer

**Files:**

- Create: `src/lib/sensors/gait-calibration.ts`
- Create: `tests/unit/gait-calibration.test.ts`

- [ ] **Step 1: Write failing calibration analyzer tests**

Create `tests/unit/gait-calibration.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the calibration tests and verify they fail**

Run:

```bash
bun test tests/unit/gait-calibration.test.ts
```

Expected:

- FAIL because `src/lib/sensors/gait-calibration.ts` does not exist.

- [ ] **Step 3: Implement the calibration analyzer**

Create `src/lib/sensors/gait-calibration.ts`:

```ts
import {
  detectGaitCycles,
  stepIntervalsSeconds,
} from "@/lib/sensors/gait-cycle";
import {
  accelerationMagnitude,
  clamp01,
  estimateSampleRateHz,
  median,
  medianAbsoluteDeviation,
  rms,
  validMotionSamples,
} from "@/lib/sensors/gait-protocol";
import type { MotionSample } from "@/types/motion";

const MIN_DISTANCE_METERS = 3;
const MAX_DISTANCE_METERS = 20;
const MIN_VALID_SAMPLES = 120;
const MIN_SAMPLE_RATE_HZ = 20;
const LOW_MOTION_WINDOW_MS = 1500;
const LOW_MOTION_RANGE = 0.22;
const LOW_ROTATION_RMS = 25;
const MIN_STEP_LENGTH_METERS = 0.25;
const MAX_STEP_LENGTH_METERS = 1.2;
const MIN_QUALITY_SCORE = 0.55;

export type GaitSessionCalibration = {
  calibratedStepLengthMeters: number;
  calibrationDistanceMeters: number;
  calibrationWalkDurationSeconds: number;
  calibrationStepCount: number;
  calibrationQualityScore: number;
  calibratedAt: string;
};

export type GaitCalibrationRejectReason =
  | "invalid_distance"
  | "insufficient_samples"
  | "insufficient_steps"
  | "no_clean_finish"
  | "implausible_step_length"
  | "low_quality";

export type GaitCalibrationResult =
  | {
      status: "accepted";
      calibration: GaitSessionCalibration;
      walkingSegment: {
        startMs: number;
        endMs: number;
      };
    }
  | {
      status: "rejected";
      reason: GaitCalibrationRejectReason;
    };

export function analyzeGaitCalibration(input: {
  samples: MotionSample[];
  enteredDistanceMeters: number;
  elapsedSeconds: number;
  now?: () => Date;
}): GaitCalibrationResult {
  const distanceMeters = input.enteredDistanceMeters;
  if (
    !Number.isFinite(distanceMeters) ||
    distanceMeters < MIN_DISTANCE_METERS ||
    distanceMeters > MAX_DISTANCE_METERS
  ) {
    return rejected("invalid_distance");
  }

  if (!Number.isFinite(input.elapsedSeconds) || input.elapsedSeconds <= 0) {
    return rejected("insufficient_samples");
  }

  const samples = validMotionSamples(input.samples);
  const sampleRateHz = estimateSampleRateHz(samples);
  if (samples.length < MIN_VALID_SAMPLES || sampleRateHz < MIN_SAMPLE_RATE_HZ) {
    return rejected("insufficient_samples");
  }

  const detected = detectGaitCycles(samples);
  const firstDetectedStep = detected.steps[0];
  if (!firstDetectedStep) {
    return rejected("insufficient_steps");
  }

  const standstillStartMs = findLowMotionWindowStart(
    samples,
    firstDetectedStep.timestampMs + 1200,
    LOW_MOTION_WINDOW_MS,
  );

  if (standstillStartMs === undefined) {
    return rejected("no_clean_finish");
  }

  const walkingSteps = detected.steps.filter(
    (step) => step.timestampMs < standstillStartMs,
  );
  const minimumSteps = minimumStepsForDistance(distanceMeters);
  if (walkingSteps.length < minimumSteps) {
    return rejected("insufficient_steps");
  }

  const intervals = stepIntervalsSeconds(walkingSteps);
  const medianIntervalMs = Math.max(300, Math.min(1400, median(intervals) * 1000));
  const segmentStartMs = Math.max(
    samples[0].timestampMs,
    walkingSteps[0].timestampMs - medianIntervalMs * 0.5,
  );
  const segmentEndMs = standstillStartMs;
  const durationSeconds = (segmentEndMs - segmentStartMs) / 1000;
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return rejected("low_quality");
  }

  const calibratedStepLengthMeters = distanceMeters / walkingSteps.length;
  if (
    calibratedStepLengthMeters < MIN_STEP_LENGTH_METERS ||
    calibratedStepLengthMeters > MAX_STEP_LENGTH_METERS
  ) {
    return rejected("implausible_step_length");
  }

  const qualityScore = calibrationQualityScore({
    distanceMeters,
    intervals,
    sampleRateHz,
    stepCount: walkingSteps.length,
  });

  if (qualityScore < MIN_QUALITY_SCORE) {
    return rejected("low_quality");
  }

  return {
    status: "accepted",
    walkingSegment: {
      startMs: Math.round(segmentStartMs),
      endMs: Math.round(segmentEndMs),
    },
    calibration: {
      calibratedStepLengthMeters: round(calibratedStepLengthMeters, 3),
      calibrationDistanceMeters: round(distanceMeters, 2),
      calibrationWalkDurationSeconds: round(durationSeconds, 2),
      calibrationStepCount: walkingSteps.length,
      calibrationQualityScore: qualityScore,
      calibratedAt: (input.now?.() ?? new Date()).toISOString(),
    },
  };
}

export function nextSessionCalibration(
  current: GaitSessionCalibration | undefined,
  result: GaitCalibrationResult,
): GaitSessionCalibration | undefined {
  return result.status === "accepted" ? result.calibration : current;
}

function rejected(reason: GaitCalibrationRejectReason): GaitCalibrationResult {
  return { status: "rejected", reason };
}

function minimumStepsForDistance(distanceMeters: number): number {
  return Math.max(4, Math.ceil(distanceMeters / MAX_STEP_LENGTH_METERS));
}

function findLowMotionWindowStart(
  samples: MotionSample[],
  afterTimestampMs: number,
  windowMs: number,
): number | undefined {
  for (let startIndex = 0; startIndex < samples.length; startIndex += 1) {
    const windowStartMs = samples[startIndex].timestampMs;
    if (windowStartMs < afterTimestampMs) continue;

    const windowEndMs = windowStartMs + windowMs;
    let endIndex = startIndex;
    while (
      endIndex < samples.length &&
      samples[endIndex].timestampMs <= windowEndMs
    ) {
      endIndex += 1;
    }

    const windowSamples = samples.slice(startIndex, endIndex);
    const actualWindowMs =
      (windowSamples.at(-1)?.timestampMs ?? windowStartMs) - windowStartMs;

    if (actualWindowMs < windowMs * 0.85) continue;
    if (isLowMotionWindow(windowSamples)) return windowStartMs;
  }

  return undefined;
}

function isLowMotionWindow(samples: MotionSample[]): boolean {
  const magnitudes = samples.map(accelerationMagnitude);
  const signalRange = Math.max(...magnitudes) - Math.min(...magnitudes);
  const rotation = rms(
    samples.map((sample) =>
      Math.hypot(
        sample.rotationAlpha ?? 0,
        sample.rotationBeta ?? 0,
        sample.rotationGamma ?? 0,
      ),
    ),
  );

  return signalRange <= LOW_MOTION_RANGE && rotation <= LOW_ROTATION_RMS;
}

function calibrationQualityScore(input: {
  distanceMeters: number;
  intervals: number[];
  sampleRateHz: number;
  stepCount: number;
}): number {
  const sampleRateScore = clamp01(input.sampleRateHz / 50);
  const stepCoverage = clamp01(
    input.stepCount / Math.max(4, input.distanceMeters / 0.65),
  );
  const rhythmScore =
    input.intervals.length >= 2
      ? clamp01(1 - robustCoefficientOfVariation(input.intervals) / 0.35)
      : 0.45;

  return clamp01(
    sampleRateScore * 0.3 + stepCoverage * 0.3 + rhythmScore * 0.3 + 0.1,
  );
}

function robustCoefficientOfVariation(values: number[]): number {
  const center = median(values);
  if (center === 0) return 1;
  return (medianAbsoluteDeviation(values) * 1.4826) / Math.abs(center);
}

function round(value: number, digits: number): number {
  return Number(value.toFixed(digits));
}
```

- [ ] **Step 4: Verify calibration analyzer tests pass**

Run:

```bash
bun test tests/unit/gait-calibration.test.ts
```

Expected:

- PASS for all calibration analyzer tests.

- [ ] **Step 5: Run related sensor tests**

Run:

```bash
bun test tests/unit/gait-calibration.test.ts tests/unit/gait-cycle.test.ts tests/unit/gait-metrics.test.ts tests/unit/gait-reconstruction.test.ts
```

Expected:

- PASS for all listed files.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add src/lib/sensors/gait-calibration.ts tests/unit/gait-calibration.test.ts
git commit -m "feat(gait): analyze measured-distance calibration walks"
```

---

## Task 3: Session State And Gait Screen UI

**Files:**

- Modify: `src/components/assessment/useAssessmentFlow.ts`
- Modify: `src/components/assessment/screens/GaitScreen.tsx`

- [ ] **Step 1: Extend normal gait handoff in the assessment flow**

In `src/components/assessment/useAssessmentFlow.ts`, add this type near the other exported flow types:

```ts
type StepLengthEstimateMethod = "height_regression" | "calibration_walk";
```

Replace `startGaitCountdown()` with:

```ts
  function startGaitCountdown(
    samples: MotionSample[] = [],
    elapsedSeconds = 0,
    stepLengthMeters?: number,
    stepLengthEstimateMethod: StepLengthEstimateMethod = "height_regression",
  ) {
    setMotion(
      summarizeMotionSamples({
        samples,
        durationSeconds: elapsedSeconds,
        stepLengthMeters,
        stepLengthEstimateMethod,
      }),
    );
  }
```

- [ ] **Step 2: Add calibration imports and local types**

In `src/components/assessment/screens/GaitScreen.tsx`, add this import:

```ts
import {
  analyzeGaitCalibration,
  nextSessionCalibration,
  type GaitCalibrationRejectReason,
  type GaitCalibrationResult,
  type GaitSessionCalibration,
} from "@/lib/sensors/gait-calibration";
```

Add these types below `formatOptionalNumber()`:

```ts
type CalibrationView = "walk" | "setup" | "capture";
type StepLengthEstimateMethod = "height_regression" | "calibration_walk";
```

Add this reason copy below the type declarations:

```ts
const calibrationReasonCopy: Record<GaitCalibrationRejectReason, string> = {
  invalid_distance: "Use a marked distance from 3 m to 20 m.",
  insufficient_samples:
    "Motion capture was too short or too sparse. Try again with the phone in the front pocket.",
  insufficient_steps:
    "Not enough walking steps were detected for that distance. Try a longer marked path if available.",
  no_clean_finish:
    "Stop at the marked line, stand still for a few seconds, then remove the phone.",
  implausible_step_length:
    "The detected step length was outside the supported range. Check the entered distance and try again.",
  low_quality:
    "The motion signal was too variable for calibration. Try again at a usual safe pace.",
};
```

- [ ] **Step 3: Add calibration state and normal-walk estimate selection**

Inside `GaitScreen`, replace:

```ts
  const stepLengthMeters = estimateStepLengthMeters(heightCm / 100);
```

with:

```ts
  const heightStepLengthMeters = estimateStepLengthMeters(heightCm / 100);
  const [calibrationView, setCalibrationView] =
    useState<CalibrationView>("walk");
  const [calibrationDistanceMeters, setCalibrationDistanceMeters] =
    useState("6");
  const [sessionCalibration, setSessionCalibration] =
    useState<GaitSessionCalibration>();
  const [calibrationResult, setCalibrationResult] =
    useState<GaitCalibrationResult>();
  const normalStepLengthMeters =
    sessionCalibration?.calibratedStepLengthMeters ?? heightStepLengthMeters;
  const normalStepLengthMethod: StepLengthEstimateMethod = sessionCalibration
    ? "calibration_walk"
    : "height_regression";
  const parsedCalibrationDistanceMeters = Number(calibrationDistanceMeters);
  const canUseCalibration = chairStandGate.canProceed;
```

- [ ] **Step 4: Add chair-stand gate guard for gait start and calibration views**

Insert this block before the existing `if (gaitPhase === "start")` block:

```tsx
  if (gaitPhase === "start" && !canUseCalibration) {
    return (
      <section className="grid gap-6">
        <ScreenHeader
          support="Chair stand screening suggests this participant should not continue to gait walking today."
          title="Gait walk not available"
        />
        <SafetyCallout tone="danger">
          Higher-risk walking tests are skipped in this flow.
        </SafetyCallout>
        <button
          className="secondary-action"
          onClick={markGaitStoppedOrUnstable}
          type="button"
        >
          Skip gait walking
        </button>
      </section>
    );
  }
```

- [ ] **Step 5: Add calibration setup view**

Insert this block after the chair-stand gate guard and before the existing `if (gaitPhase === "start")` block:

```tsx
  if (gaitPhase === "start" && calibrationView === "setup") {
    return (
      <section className="grid gap-6">
        <ScreenHeader
          eyebrow="Optional calibration"
          support="Use a marked straight path to calibrate step length for this gait screen only."
          title="Use measured distance"
        />
        <SafetyCallout>
          Walk to the marked line. At the line, stop walking and stand still.
          Then take out the phone and press Stop.
        </SafetyCallout>
        <FormGrid>
          <TextField
            label="Marked distance in metres"
            onChange={setCalibrationDistanceMeters}
            type="number"
            value={calibrationDistanceMeters}
          />
        </FormGrid>
        <div className="flex flex-wrap gap-2">
          {[4, 6, 10].map((distance) => (
            <button
              className="secondary-action"
              key={distance}
              onClick={() => setCalibrationDistanceMeters(String(distance))}
              type="button"
            >
              {distance} m
            </button>
          ))}
        </div>
        {calibrationResult?.status === "accepted" && (
          <div className="quiet-card grid gap-2 p-5">
            <p className="text-[length:var(--text-label)] font-bold text-[var(--muted)]">
              Calibration accepted
            </p>
            <p>
              Step length:{" "}
              {calibrationResult.calibration.calibratedStepLengthMeters.toFixed(
                2,
              )}{" "}
              m
            </p>
            <p>
              Quality:{" "}
              {Math.round(
                calibrationResult.calibration.calibrationQualityScore * 100,
              )}
              %
            </p>
          </div>
        )}
        {calibrationResult?.status === "rejected" && (
          <SafetyCallout>
            {calibrationReasonCopy[calibrationResult.reason]}
          </SafetyCallout>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            className="primary-action"
            onClick={() => setCalibrationView("capture")}
            type="button"
          >
            Start calibration walk
          </button>
          <button
            className="secondary-action"
            onClick={() => setCalibrationView("walk")}
            type="button"
          >
            Timed walk without calibration
          </button>
        </div>
      </section>
    );
  }
```

- [ ] **Step 6: Add calibration capture view**

Insert this block after the setup view and before the normal start block:

```tsx
  if (gaitPhase === "start" && calibrationView === "capture") {
    return (
      <TestStartPanel
        countdownCueWord="start walking"
        fallbackActions={[
          {
            label: "Cancel calibration",
            onClick: () => setCalibrationView("setup"),
          },
        ]}
        guidedPocketMode
        onPrimary={(samples, elapsedSeconds) => {
          const result = analyzeGaitCalibration({
            samples,
            elapsedSeconds,
            enteredDistanceMeters: parsedCalibrationDistanceMeters,
          });
          setCalibrationResult(result);
          setSessionCalibration((current) =>
            nextSessionCalibration(current, result),
          );
          setCalibrationView(result.status === "accepted" ? "walk" : "setup");
        }}
        primaryLabel="Start calibration walk"
        resultItems={[]}
        safetyInstruction="Walk the marked distance at your usual safe pace. Stop at the line, stand still, then remove the phone and press Stop."
        showMotionReadout
        statusItems={[
          {
            label: "Motion",
            value: permissionLabel(motionStatus?.permissionState),
          },
          {
            label: "Distance",
            value: Number.isFinite(parsedCalibrationDistanceMeters)
              ? `${parsedCalibrationDistanceMeters} m`
              : "Check distance",
          },
        ]}
        title="Calibration walk"
      >
        <MotionSensorStatus onStatusChange={setMotionStatus} />
      </TestStartPanel>
    );
  }
```

- [ ] **Step 7: Wire calibration into the normal timed walk**

In the existing normal `TestStartPanel`, change `fallbackActions` to include the calibration entry first:

```tsx
        fallbackActions={[
          ...(canUseCalibration
            ? [
                {
                  label: "Use measured distance",
                  onClick: () => setCalibrationView("setup"),
                },
              ]
            : []),
          {
            label: "Enter manually",
            onClick: () => setGaitPhase("manual"),
          },
          {
            label: "Mark stopped or unstable",
            onClick: markGaitStoppedOrUnstable,
          },
        ]}
```

Replace the normal walk `onPrimary` with:

```tsx
        onPrimary={(samples, elapsedSeconds) =>
          startGaitCountdown(
            samples,
            elapsedSeconds,
            normalStepLengthMeters,
            normalStepLengthMethod,
          )
        }
```

Replace the `Speed` status item value with:

```tsx
            value: sessionCalibration ? "Calibration walk" : speedSourceLabel(motion),
```

Add this block above `<MotionSensorStatus onStatusChange={setMotionStatus} />` inside the normal walk `TestStartPanel` children:

```tsx
        {sessionCalibration && (
          <div className="quiet-card grid gap-2 p-5">
            <p className="text-[length:var(--text-label)] font-bold text-[var(--muted)]">
              Calibration walk ready
            </p>
            <p>
              Step length:{" "}
              {sessionCalibration.calibratedStepLengthMeters.toFixed(2)} m
            </p>
            <p>
              Quality:{" "}
              {Math.round(sessionCalibration.calibrationQualityScore * 100)}%
            </p>
          </div>
        )}
```

- [ ] **Step 8: Run TypeScript-targeted unit tests**

Run:

```bash
bun test tests/unit/motion-summary.test.ts tests/unit/gait-display.test.ts tests/unit/gait-calibration.test.ts
```

Expected:

- PASS for all listed files.

- [ ] **Step 9: Commit Task 3**

Run:

```bash
git add src/components/assessment/useAssessmentFlow.ts src/components/assessment/screens/GaitScreen.tsx
git commit -m "feat(gait): add session calibration walk UI"
```

---

## Task 4: Safety, Persistence, And Full Verification

**Files:**

- Inspect only unless a check fails: `src/types/profile.ts`
- Inspect only unless a check fails: `src/components/auth/UserProfileProvider.tsx`
- Inspect only unless a check fails: `src/lib/assessment/session-draft.ts`
- Inspect only unless a check fails: `src/lib/user-profile/**`
- Inspect only unless a check fails: `src/lib/demo/profile/**`

- [ ] **Step 1: Confirm no profile or persistence fields were added**

Run:

```bash
rg -n "gaitCalibration|GaitSessionCalibration|calibration_walk" src/types/profile.ts src/components/auth/UserProfileProvider.tsx src/lib/assessment/session-draft.ts src/lib/user-profile src/lib/demo/profile
```

Expected:

- No matches for `gaitCalibration` or `GaitSessionCalibration`.
- No profile, Firestore, localStorage, demo profile, or draft persistence changes.
- `calibration_walk` may appear only if a shared profile file already references motion display data; if that happens, inspect the match and remove it unless it is a type import required by existing assessment metrics.

- [ ] **Step 2: Run the focused unit suite**

Run:

```bash
bun test tests/unit
```

Expected:

- PASS for the full unit suite.

- [ ] **Step 3: Run lint**

Run:

```bash
bun run lint
```

Expected:

- Exit code 0.
- If the existing `TestStartPanel.tsx` unused `onRunStart` warning still appears, record it in the final implementation summary unless the implementation touched that callback and can cleanly wire it without changing gait behavior.

- [ ] **Step 4: Run production build**

Run:

```bash
bun run build
```

Expected:

- Exit code 0.

- [ ] **Step 5: Commit verification cleanup if needed**

If Steps 1-4 required code changes, run:

```bash
git add <changed-files>
git commit -m "fix(gait): verify session calibration integration"
```

If Steps 1-4 did not require changes, do not create an empty commit.

---

## Acceptance Checklist

- [ ] Calibration is optional and reachable from the gait screen as `Use measured distance`.
- [ ] Calibration remains in `GaitScreen` state only and is not saved to profile, Firestore, localStorage, demo profile overrides, or assessment history.
- [ ] Calibration capture instructions state that Stop ends recording and is not the finish-line timestamp.
- [ ] Analyzer uses a detected walking segment and trims phone-removal tail after a clean standstill.
- [ ] Rejected calibration does not overwrite an accepted current-screen calibration.
- [ ] Normal timed gait uses calibrated step length and `absoluteEstimateMethod: "calibration_walk"` when session calibration exists.
- [ ] Default timed gait still uses height-regression step length and `absoluteEstimateMethod: "height_regression"` when no session calibration exists.
- [ ] Stopped, unstable, denied-permission, manual, and demo fallbacks remain available.
- [ ] Chair stand gate failure still blocks calibration and gait walking.
- [ ] `bun test tests/unit`, `bun run lint`, and `bun run build` pass before final handoff.
