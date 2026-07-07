# Gait Result Review Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route every gait outcome into a dedicated local result review screen with a back button, while preserving safety gates and fallbacks.

**Architecture:** Keep the change local to the gait screen and display helpers. Extract reusable result item/source-label helpers into `gait-display.ts`, then replace the current inline gait start/manual branching with a local `GaitView` state that covers start, calibration setup, calibration capture, manual entry, and result review.

**Tech Stack:** TypeScript, React/Next.js client components, existing assessment UI primitives, Bun test runner.

---

## File Structure

Modify:

- `src/components/assessment/screens/gait-display.ts`  
  Add pure result item and source-label helpers so result tiles are not duplicated between start and result views.
- `tests/unit/gait-display.test.ts`  
  Add helper tests for result item construction and source/status labels.
- `src/components/assessment/screens/GaitScreen.tsx`  
  Add local `GaitView` state, route live/manual/demo/stopped outcomes to a result screen, and keep calibration as pre-walk setup.

Do not modify:

- `src/types/profile.ts`
- `src/components/auth/UserProfileProvider.tsx`
- `src/lib/assessment/session-draft.ts`
- `src/lib/functional-tests/gates.ts`
- `src/lib/vision/**`
- `src/content/**`
- `src/config/**`

---

## Task 1: Result Display Helpers

**Files:**

- Modify: `src/components/assessment/screens/gait-display.ts`
- Modify: `tests/unit/gait-display.test.ts`

- [ ] **Step 1: Write failing helper tests**

Modify the import in `tests/unit/gait-display.test.ts`:

```ts
import {
  analysisModeLabel,
  gaitResultItems,
  gaitSourceLabel,
  gaitSpeedLabel,
  shapeResultItem,
  speedSourceLabel,
} from "../../src/components/assessment/screens/gait-display";
```

Append these tests inside `describe("gait display helpers", ...)`:

```ts
  test("builds reusable gait result items", () => {
    expect(
      gaitResultItems(
        motion({
          absoluteEstimateMethod: "calibration_walk",
          analysisMode: "reconstruction_full",
          cadenceStepsPerMinute: 104.4,
          cycleQualityScore: 0.82,
          gaitSpeedMetersPerSecond: 0.91,
          stabilityScore: 0.73,
          rhythmConsistency: 0.68,
          stepCount: 44,
          trajectoryShape: {
            symmetry: 0.7,
          },
        }),
      ),
    ).toEqual([
      { label: "Calibration speed", value: "0.91 m/s" },
      { label: "Cadence", value: "104.4 steps/min" },
      { label: "Steps", value: "44" },
      { label: "Rhythm", value: "68%" },
      { label: "Stability", value: "73%" },
      { label: "Quality", value: "82%" },
      { label: "Mode", value: "Full sensor" },
      { label: "Symmetry", value: "70%" },
    ]);
  });

  test("labels gait source and stopped status", () => {
    expect(gaitSourceLabel(motion({ source: "accelerometer" }))).toBe(
      "Live sensor",
    );
    expect(gaitSourceLabel(motion({ source: "manual" }))).toBe("Manual entry");
    expect(gaitSourceLabel(motion({ source: "demo" }))).toBe("Demo result");
    expect(
      gaitSourceLabel(
        motion({
          completionStatus: "stopped",
          source: "manual",
        }),
      ),
    ).toBe("Stopped");
  });
```

- [ ] **Step 2: Run the helper tests and verify they fail**

Run:

```bash
bun test tests/unit/gait-display.test.ts
```

Expected:

- FAIL because `gaitResultItems` and `gaitSourceLabel` are not exported.

- [ ] **Step 3: Implement display helpers**

In `src/components/assessment/screens/gait-display.ts`, add this helper near the top after `GaitDisplayItem`:

```ts
function formatOptionalNumber(value: number | undefined, suffix: string) {
  return value === undefined ? "Not measured" : `${value}${suffix}`;
}
```

Add this function after `shapeResultItem()`:

```ts
export function gaitResultItems(motion: MotionMetrics): GaitDisplayItem[] {
  const shapeItem = shapeResultItem(motion);

  return [
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
        motion.stepCount === undefined ? "Not measured" : String(motion.stepCount),
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
    ...(shapeItem ? [shapeItem] : []),
  ];
}
```

Add this function after `speedSourceLabel()`:

```ts
export function gaitSourceLabel(motion: MotionMetrics) {
  if (motion.completionStatus === "stopped") {
    return "Stopped";
  }
  if (motion.source === "accelerometer") {
    return "Live sensor";
  }
  if (motion.source === "demo") {
    return "Demo result";
  }
  return "Manual entry";
}
```

- [ ] **Step 4: Run the helper tests and verify they pass**

Run:

```bash
bun test tests/unit/gait-display.test.ts
```

Expected:

- PASS for all gait display helper tests.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add src/components/assessment/screens/gait-display.ts tests/unit/gait-display.test.ts
git commit -m "feat(gait): add reusable result display helpers"
```

---

## Task 2: Gait Result Review Screen

**Files:**

- Modify: `src/components/assessment/screens/GaitScreen.tsx`

- [ ] **Step 1: Update imports and local view types**

In `src/components/assessment/screens/GaitScreen.tsx`, replace the gait-display import with:

```ts
import {
  gaitResultItems,
  gaitSourceLabel,
  speedSourceLabel,
} from "@/components/assessment/screens/gait-display";
```

Remove the local `formatOptionalNumber()` helper.

Replace:

```ts
type CalibrationView = "walk" | "setup" | "capture";
```

with:

```ts
type GaitView =
  | "start"
  | "calibration_setup"
  | "calibration_capture"
  | "manual"
  | "result";
```

- [ ] **Step 2: Replace local calibration view state with gait view state**

Replace:

```ts
  const [calibrationView, setCalibrationView] =
    useState<CalibrationView>("walk");
```

with:

```ts
  const [gaitView, setGaitView] = useState<GaitView>("start");
```

Remove this line because result items will be built by the helper:

```ts
  const shapeItem = shapeResultItem(motion);
```

Add these local helpers before the first `if (gaitPhase === "demo")` branch:

```tsx
  function showGaitStart() {
    setGaitPhase("start");
    setGaitView("start");
  }

  function showManualEntry() {
    setGaitPhase("start");
    setGaitView("manual");
  }

  function showResult() {
    setGaitPhase("start");
    setGaitView("result");
  }

  function markStoppedInScreen() {
    setMotion((current) => ({
      ...current,
      completionStatus: "stopped",
      stabilityScore: 0.3,
      rhythmConsistency: 0.35,
      source: "manual",
    }));
    showResult();
  }

  function useDemoGaitResult() {
    setMotion(getDemoMotionMetrics());
    showResult();
  }

  function updateManualMotion(patch: Partial<MotionMetrics>) {
    setMotion((current) => ({
      stabilityScore:
        patch.stabilityScore ?? (current.source === "manual" ? current.stabilityScore : 0),
      rhythmConsistency:
        patch.rhythmConsistency ??
        (current.source === "manual" ? current.rhythmConsistency : 0),
      gaitSpeedMetersPerSecond:
        patch.gaitSpeedMetersPerSecond ??
        (current.source === "manual"
          ? current.gaitSpeedMetersPerSecond
          : undefined),
      absoluteEstimateMethod: "none",
      completionStatus: "completed",
      source: "manual",
    }));
  }
```

- [ ] **Step 3: Route demo, blocked gait, and calibration views through `gaitView`**

Replace the demo continue callback:

```tsx
return <GaitWalkDemo onContinue={() => setGaitPhase("start")} />;
```

with:

```tsx
return <GaitWalkDemo onContinue={showGaitStart} />;
```

Replace the blocked gait button `onClick`:

```tsx
onClick={markGaitStoppedOrUnstable}
```

with:

```tsx
onClick={markStoppedInScreen}
```

Replace each calibration view comparison:

```tsx
calibrationView === "setup"
calibrationView === "capture"
```

with:

```tsx
gaitView === "calibration_setup"
gaitView === "calibration_capture"
```

Replace each calibration view update:

```tsx
setCalibrationView("setup")
setCalibrationView("capture")
setCalibrationView("walk")
```

with:

```tsx
setGaitView("calibration_setup")
setGaitView("calibration_capture")
setGaitView("start")
```

- [ ] **Step 4: Add the result screen branch**

Insert this branch after the calibration capture branch and before the normal start branch:

```tsx
  if (gaitView === "result") {
    const stopped = motion.completionStatus === "stopped";

    return (
      <section className="grid gap-6">
        <ScreenHeader
          support={
            stopped
              ? "Gait walking was stopped or marked unstable. Higher-risk testing is skipped in this flow."
              : "Review the gait walk measurements before returning to the test screen."
          }
          title="Gait walk result"
        />
        <div className="flex flex-wrap gap-2">
          <span className="status-pill status-pill--ready">
            Source: {gaitSourceLabel(motion)}
          </span>
          <span className="status-pill status-pill--ready">
            Speed: {speedSourceLabel(motion)}
          </span>
        </div>
        {stopped && (
          <SafetyCallout tone="danger">
            Gait walking suggests caution. The floor-rising test is the
            highest-risk test and should not be attempted in this flow.
          </SafetyCallout>
        )}
        <div>
          <h2 className="mb-3 text-[length:var(--text-lead)] font-semibold">
            Results
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gaitResultItems(motion).map((item) => (
              <div className="stat-tile" key={item.label}>
                <p className="text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
                  {item.label}
                </p>
                <p className="mt-1 text-xl font-bold leading-tight">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="secondary-action"
            onClick={showGaitStart}
            type="button"
          >
            Back to gait test
          </button>
          <button
            className="secondary-action"
            onClick={showManualEntry}
            type="button"
          >
            Enter manually
          </button>
          {!stopped && (
            <button
              className="secondary-action"
              onClick={markStoppedInScreen}
              type="button"
            >
              Mark stopped or unstable
            </button>
          )}
        </div>
      </section>
    );
  }
```

- [ ] **Step 5: Update normal start actions and live completion**

In the normal `TestStartPanel`, replace the `fallbackActions` block with:

```tsx
        fallbackActions={[
          ...(canUseCalibration
            ? [
                {
                  label: "Use measured distance",
                  onClick: () => setGaitView("calibration_setup"),
                },
              ]
            : []),
          {
            label: "Enter manually",
            onClick: showManualEntry,
          },
          {
            label: "Mark stopped or unstable",
            onClick: markStoppedInScreen,
          },
        ]}
```

Replace the live walk `onPrimary` with:

```tsx
        onPrimary={(samples, elapsedSeconds) => {
          startGaitCountdown(
            samples,
            elapsedSeconds,
            normalStepLengthMeters,
            normalStepLengthMethod,
          );
          showResult();
        }}
```

Replace the `resultItems` prop with:

```tsx
        resultItems={gaitResultItems(motion)}
```

- [ ] **Step 6: Replace the manual screen branch**

Replace the final fallback `return (` branch with this manual branch condition and content:

```tsx
  if (gaitView === "manual" || gaitPhase === "manual") {
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
              updateManualMotion({
                gaitSpeedMetersPerSecond: Number(value),
              })
            }
            type="number"
            value={String(motion.gaitSpeedMetersPerSecond ?? 0)}
          />
          <TextField
            label="Stability score"
            onChange={(value) =>
              updateManualMotion({
                stabilityScore: Number(value),
              })
            }
            type="number"
            value={String(motion.stabilityScore)}
          />
        </FormGrid>
        <div className="flex flex-wrap gap-3">
          <button
            className="primary-action"
            onClick={showResult}
            type="button"
          >
            Review result
          </button>
          <button
            className="secondary-action"
            onClick={showGaitStart}
            type="button"
          >
            Back to gait test
          </button>
          <button
            className="secondary-action"
            onClick={useDemoGaitResult}
            type="button"
          >
            Use demo gait walk
          </button>
          <button
            className="secondary-action"
            onClick={markStoppedInScreen}
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

Add this final fallback after the manual branch:

```tsx
  return null;
```

- [ ] **Step 7: Run targeted checks**

Run:

```bash
bun test tests/unit/gait-display.test.ts tests/unit/direct-gait-flow.test.ts
bun run lint
```

Expected:

- Unit tests pass.
- Lint exits 0.

- [ ] **Step 8: Commit Task 2**

Run:

```bash
git add src/components/assessment/screens/GaitScreen.tsx
git commit -m "feat(gait): route outcomes to result screen"
```

---

## Task 3: Full Verification

**Files:**

- Inspect only unless a check fails: `src/components/assessment/screens/GaitScreen.tsx`
- Inspect only unless a check fails: `src/components/assessment/screens/gait-display.ts`

- [ ] **Step 1: Confirm no persistence scope was added**

Run:

```bash
rg -n "gaitResult|gaitView|GaitView|gaitCalibration|GaitSessionCalibration" src/types/profile.ts src/components/auth/UserProfileProvider.tsx src/lib/assessment/session-draft.ts
```

Expected:

- No matches in profile, provider, or draft files.

- [ ] **Step 2: Run full unit suite**

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

- [ ] **Step 4: Run production build**

Run:

```bash
bun run build
```

Expected:

- Exit code 0.

- [ ] **Step 5: Commit verification cleanup if required**

If Steps 1-4 required code changes, run:

```bash
git add <changed-files>
git commit -m "fix(gait): verify result review screen"
```

If Steps 1-4 did not require changes, do not create an empty commit.

---

## Acceptance Checklist

- [ ] Live gait completion lands on `Gait walk result`.
- [ ] Manual gait entry lands on `Gait walk result` after `Review result`.
- [ ] Demo gait lands on `Gait walk result`.
- [ ] Mark stopped or unstable lands on `Gait walk result` and keeps `completionStatus: "stopped"`.
- [ ] Stopped result shows a danger callout and still blocks floor-rising through existing motion gate logic.
- [ ] `Back to gait test` returns to the gait start screen without clearing metrics.
- [ ] Calibration remains session-only and completed timed gait now lands on the result screen.
- [ ] No profile, persistence, dashboard, report, or clinical-copy scope changes.
- [ ] `bun test tests/unit`, `bun run lint`, and `bun run build` pass.
