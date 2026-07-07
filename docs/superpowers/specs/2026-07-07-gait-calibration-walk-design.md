# Gait Calibration Walk Design

Date: 2026-07-07
Branch: `feature/daniel-motion-tests`

## Summary

Physio-Aid will add an optional current-session gait calibration walk. The calibration lets a user walk a known marked distance immediately before the gait test, then uses the resulting calibrated step length for that assessment run only.

This design assumes a one-phone flow. The phone is in the user's pocket during walking, so the Stop button cannot be treated as the finish-line timestamp. Instead, Stop means "end recording." The analysis must infer the actual walking segment from sensor data and trim the phone-removal / stop-button tail.

## Goals

- Add an optional measured-distance calibration path for gait speed estimates.
- Keep successful calibration in the current gait screen/session only.
- Keep the existing 25-second timed gait walk as the default path.
- Make calibration use explicit in result metadata through `absoluteEstimateMethod: "calibration_walk"`.
- Fail safely when calibration quality is poor, implausible, or contaminated by phone handling.
- Preserve all existing safety gates, manual fallback, demo fallback, and stopped/unstable paths.

## Non-Goals

- No change to the default assessment order.
- No replacement of the timed gait walk with a required distance walk.
- No diagnosis, prescription, or clinical validation claim.
- No raw sensor-stream persistence by default.
- No change to floor-rising or camera modules.
- No separate caregiver device or remote stop control in this slice.
- No user profile, Firestore, localStorage, or cross-assessment calibration persistence.

## Recommended Approach

Use an optional session-level calibration flow.

Rejected alternatives:

- Profile-level calibration: more convenient long term, but we are explicitly avoiding profile persistence in this slice.
- Replacing the timed walk with a measured-distance walk: more accurate speed but higher setup burden and worse default UX.

## One-Phone Constraint

The calibration flow must assume the same phone is used for capture and button control. While the phone is in the user's pocket, nobody can press Stop without removing or handling the same phone.

Therefore:

```txt
Stop button = end recording
Stop button != finish-line timestamp
```

The user instruction should be:

```txt
Walk to the marked line. At the line, stop walking and stand still. Then take out the phone and press Stop.
```

Analysis should use the detected walking segment, not the full button-press duration.

## User Flow

Entry point on gait screen:

```txt
Use measured distance
```

Calibration flow:

1. Choose or enter distance.
   - Quick choices: `4 m`, `6 m`, `10 m`.
   - Custom value allowed from `3 m` to `20 m`.
2. Show safety reminder.
   - Clear path.
   - Walk at usual safe pace.
   - Stop at the marked line.
   - Stand still before removing the phone.
3. Guided pocket capture.
   - Place phone in a front pocket.
   - Countdown.
   - Walk the marked distance.
   - Stop walking at the marked line.
   - Stand still briefly.
   - Remove phone and press Stop.
4. Result.
   - Use calibration for the next timed gait walk in this screen if quality passes.
   - Show retry if quality fails.
   - Keep fallback to timed walk without calibration.

Calibration must not be available when the chair stand gate blocks gait walking.

## Data Model

Add a session-only calibration value owned by the gait screen state:

```ts
export type GaitSessionCalibration = {
  calibratedStepLengthMeters: number;
  calibrationDistanceMeters: number;
  calibrationWalkDurationSeconds: number;
  calibrationStepCount: number;
  calibrationQualityScore: number;
  calibratedAt: string;
};
```

Do not add this field to `UserProfile`. Do not persist it to Firestore, localStorage, demo profile overrides, or assessment history in this slice. It exists only while the current gait screen is mounted.

Extend gait estimate method:

```ts
absoluteEstimateMethod:
  | "course_distance"
  | "calibration_walk"
  | "height_regression"
  | "none";
```

Existing records without this value remain valid.

## Calibration Analysis

Calibration analyzer input:

```ts
{
  samples: MotionSample[];
  enteredDistanceMeters: number;
  elapsedSeconds: number;
}
```

Calibration analyzer output:

```ts
type GaitCalibrationResult =
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
      reason:
        | "invalid_distance"
        | "insufficient_samples"
        | "insufficient_steps"
        | "no_clean_finish"
        | "implausible_step_length"
        | "low_quality";
    };
```

Segment detection:

```txt
raw calibration samples
  -> validate capture
  -> resample
  -> detect gait cycles / steps
  -> ignore start handling / pocket settling buffer
  -> find continuous gait segment
  -> detect finish as gait stopping plus short low-motion standing window
  -> trim phone-removal / stop-button handling tail
  -> compute calibration from walking segment only
```

Finish detection:

- Prefer gait cycles ending followed by `3-5 s` of low-motion standing.
- If phone-removal handling begins after a valid walking segment, trim from the handling spike.
- If there is no clean standstill or clear walking segment, reject calibration.

Calculations:

```ts
calibrationWalkDurationSeconds = (segmentEndMs - segmentStartMs) / 1000;
calibratedStepLengthMeters = enteredDistanceMeters / stepCount;
courseSpeedMetersPerSecond =
  enteredDistanceMeters / calibrationWalkDurationSeconds;
```

The accepted session calibration keeps the fields in `GaitSessionCalibration`. The course speed can be displayed in the calibration result, but it should not be added to persisted assessment history in this slice.

## Validity Rules

Accept calibration only when:

- Distance is `>= 3 m` and `<= 20 m`.
- The walking segment has enough samples.
- Step count is sufficient for the entered distance.
- A clean finish is detected before the phone-removal tail.
- `calibratedStepLengthMeters` is plausible, initially `0.25-1.2 m`.
- `calibrationQualityScore` passes a threshold.

Reject calibration when:

- The user immediately removes the phone without standing still.
- The user keeps walking after the marked line.
- The capture has too few samples or too low sample rate.
- The detected step length is implausible.
- The walking segment cannot be separated from handling motion.

Failed calibration must not overwrite a previous accepted calibration in the current gait screen state.

## Normal Gait Walk Integration

Default timed gait remains unchanged. When a valid session calibration exists, the next normal gait analysis should use:

```ts
stepLengthMeters =
  sessionCalibration?.calibratedStepLengthMeters
    ?? heightRegressionStepLengthMeters;
```

When session calibration is used, the result should include:

```ts
absoluteEstimateMethod: "calibration_walk";
```

If no session calibration exists, keep the current height-regression estimate:

```ts
absoluteEstimateMethod: "height_regression";
```

Calibration must not override safety gates. If the current gait capture is stopped, unstable, or poor quality, the gait result remains stopped/blocked even when a session calibration exists.

## UI Changes

Gait screen additions:

- Secondary action: `Use measured distance`.
- Status label when session calibration exists:
  - `Speed: Calibration walk`
- Status label without session calibration:
  - `Speed: Estimated`

Calibration result states:

- Accepted:
  - Show calibrated step length.
  - Show calibration quality.
  - Return to normal gait walk.
- Rejected:
  - Show reason in non-clinical, action-oriented language.
  - Offer retry.
  - Offer timed walk without calibration.

Do not add clinical claims. Calibration improves estimate scaling; it does not validate gait medically.

## Fallbacks And Safety

- Manual entry remains available.
- Demo gait remains available.
- Motion permission denial returns to existing fallback options.
- Chair stand gate failure blocks calibration and gait walking.
- Calibration failure does not block the normal timed walk unless the current safety gate says gait walking should not proceed.
- Previous accepted calibration in the current screen remains unchanged after a failed recalibration.

## Testing Strategy

Add focused unit tests for:

- distance validation accepts `3-20 m` and rejects outside values.
- walking segment detection trims a phone-removal / stop-button tail.
- calibration rejects samples without a clean standstill finish.
- calibration rejects implausible step length.
- accepted calibration produces `calibratedStepLengthMeters` from entered distance and detected step count.
- failed recalibration does not overwrite the current screen's previously accepted calibration.
- normal gait summary uses `calibration_walk` when session calibration supplies step length.
- normal gait still fails closed when current capture is unusable, even with session calibration.

Verification commands:

```bash
bun test tests/unit
bun run lint
bun run build
```

## Risks

- Finish detection can be ambiguous if the user removes the phone immediately at the line.
- Very short distances produce noisy step-length estimates. A 3 m lower bound is supported for constrained spaces, but 6-10 m is preferred when available.
- Users may enter an incorrect distance. Plausibility checks reduce but cannot eliminate this risk.
- Session-only calibration means users must recalibrate in a future assessment if they want calibrated estimates again.

## Acceptance Criteria

- Calibration is optional and current-session only.
- Stop button is not used as finish-line time.
- Phone-removal tail is trimmed or calibration is rejected.
- Successful calibration keeps step length, distance, duration, step count, quality, and timestamp in gait screen state.
- Failed calibration does not overwrite existing session calibration.
- Normal gait uses session calibration for speed estimate labeling when available.
- Safety gates and fallbacks remain intact.
