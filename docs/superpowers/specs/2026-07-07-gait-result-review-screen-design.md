# Gait Result Review Screen Design

Date: 2026-07-07
Branch: `feature/daniel-motion-tests`

## Summary

The gait screen will add a local result review sub-screen shown after any gait outcome: live sensor walk, manual entry, demo result, or stopped/unstable mark. The result screen separates capture from review so the user sees a clear "test complete" state with the relevant metrics and a back button.

## Goals

- Show a dedicated gait result screen after the gait test completes.
- Route live sensor, manual, demo, and stopped/unstable outcomes into the same result screen.
- Keep gait result review local to `GaitScreen`; do not add new persisted fields or assessment schema.
- Preserve safety gates: stopped or unstable gait must still block floor-rising.
- Keep manual and demo fallbacks available.

## Non-Goals

- No changes to chair stand or floor-rising result flows.
- No new clinical interpretation, diagnosis, or validation language.
- No profile-level storage, calibration persistence, or assessment-history schema changes.
- No dashboard/report redesign.

## Proposed Flow

Normal live gait:

```txt
Gait start screen
  -> guided 25 second walk
  -> set motion metrics
  -> gait result screen
```

Manual fallback:

```txt
Gait start screen
  -> Enter manually
  -> manual entry screen
  -> user enters gait values
  -> gait result screen
```

Stopped or unstable:

```txt
Gait start screen
  -> Mark stopped or unstable
  -> set stopped motion metrics
  -> gait result screen with safety callout
```

Demo result:

```txt
Manual/fallback area
  -> Use demo gait walk
  -> set demo motion metrics
  -> gait result screen
```

## UI Design

Add a local `gaitView` state inside `GaitScreen`, separate from `gaitPhase`.

Recommended values:

```ts
type GaitView =
  | "start"
  | "calibration_setup"
  | "calibration_capture"
  | "manual"
  | "result";
```

The result screen should use existing visual primitives:

- `ScreenHeader`
- `SafetyCallout`
- existing `stat-tile` result grid styling
- existing secondary/primary action button classes

Result screen content:

- Header: `Gait walk result`
- Support copy based on source/status:
  - live/manual/demo completed: decision-support neutral completion wording
  - stopped/unstable: safety-first wording that higher-risk testing is skipped
- Result tiles:
  - speed label from `gaitSpeedLabel(motion)`
  - cadence
  - steps
  - rhythm
  - stability
  - quality
  - mode
  - shape item when available
- Status chips:
  - source: live sensor, manual, demo, or stopped
  - speed source from `speedSourceLabel(motion)`

Result actions:

- `Back to gait test`: returns to the gait start screen without clearing the current motion result.
- `Enter manually`: opens manual entry from the result screen.
- `Mark stopped or unstable`: remains available unless already stopped.
- The existing assessment hub/continue flow outside `GaitScreen` remains unchanged.

## Data Flow

No new persisted data is needed. `GaitScreen` should continue using `flow.setMotion()` and `flow.startGaitCountdown()`.

Implementation shape:

- Live `onPrimary` calls `startGaitCountdown(...)`, then switches `gaitView` to `"result"`.
- Manual text field updates continue to write `MotionMetrics` with source `manual`.
- Manual screen gets a `Review result` action that switches to `"result"`.
- Stopped action should set stopped metrics and switch to `"result"` instead of immediately returning to the hub.
- Demo action should set demo metrics and switch to `"result"`.

Replace direct use of `markGaitStoppedOrUnstable` inside `GaitScreen` with a local helper that sets equivalent stopped metrics and keeps the user in the gait result screen. The existing flow helper returns to the hub immediately, so it should not be used for this specific in-screen action.

## Safety Behavior

- If chair stand gate blocks gait, keep the existing blocked gait screen and do not allow gait capture.
- If gait is marked stopped/unstable, the result screen must show a danger callout explaining that floor-rising is skipped in this flow.
- The underlying `MotionMetrics.completionStatus = "stopped"` must still be set so `getMotionGate()` blocks floor-rising.
- No result copy should claim diagnosis, clinical validation, or medical advice.

## Calibration Interaction

Calibration remains a setup step before the normal timed gait walk.

- Successful calibration returns to the gait start screen with `Calibration walk ready`.
- The next timed gait walk uses calibration as currently implemented.
- After the timed gait walk finishes, the user lands on the gait result screen.
- Calibration failure still returns to calibration setup with retry/fallback actions.

## Testing Strategy

Use the existing unit suite as the primary regression coverage:

- `gait-display` helper expectations remain unchanged and continue to cover labels.
- If result tile construction is extracted into a pure helper during implementation, add a focused unit test for that helper in the same change.
- Existing `motion-summary`, `gait-calibration`, and gate tests should continue to pass.

Verification commands:

```bash
bun test tests/unit
bun run lint
bun run build
```

## Acceptance Criteria

- Live gait completion lands on a dedicated result screen.
- Manual gait entry lands on the same result screen after the user chooses to review.
- Demo gait lands on the same result screen.
- Mark stopped or unstable lands on the same result screen and still blocks floor-rising.
- Result screen has a back button to return to gait start without clearing metrics.
- Calibration behavior remains session-only and unchanged except that completed timed gait now lands on the result screen.
- No profile, persistence, dashboard, report, or clinical-copy scope creep is introduced.
