# Gait Reconstruction Refactor Design

Date: 2026-07-07
Branch: `feature/daniel-motion-tests`

## Summary

Physio-Aid will add a browser-only gait reconstruction core for the motion sensor gait walk while keeping the current safety-gated assessment flow stable. The new core will run behind the existing `summarizeMotionSamples()` boundary and map back into `MotionMetrics`, with small optional fields for analysis mode, estimate method, and trajectory-shape details.

The current magnitude step detector remains in use as a quality-control and step/stride cross-check. It is not removed. Manual, demo, stopped, and unavailable fallbacks remain unchanged.

## Goals

- Reimplement the attached browser gait reconstruction design in TypeScript using `gl-matrix` for quaternion and vector math.
- Preserve the current gait flow:
  `TestStartPanel -> startGaitCountdown -> summarizeMotionSamples -> MotionMetrics`.
- Keep existing safety gate behavior based on `completionStatus`, `stabilityScore`, and `rhythmConsistency`.
- Use derived metrics only. Do not store raw high-frequency sensor streams by default.
- Label absolute gait speed and stride length as estimates unless a known course distance is provided.
- Keep UI changes light and focused on transparency: estimated speed, analysis mode, and optional shape metrics.

## Non-Goals

- No clinical validation claim.
- No diagnosis, prescription, or autonomous medical advice.
- No support-time, joint-angle, or foot-contact outputs for the pocket-phone v1.
- No raw video or raw sensor persistence.
- No broad dashboard/report redesign.
- No changes to floor-rising, camera, clinical thresholds, or recommendation copy unless required for type compatibility.

## Dependency Decision

The implementation will add `gl-matrix` as a production dependency. This was explicitly approved by the user. The project preference is to use Bun for dependency installation.

## Recommended Approach

Use a parallel reconstruction core behind the existing motion summary boundary.

The existing heuristic path becomes a QC and fallback layer instead of the primary source of all gait outputs. This keeps the assessment flow stable while allowing the new reconstruction pipeline to produce richer cadence, cycle timing, shape, and mode metadata.

Rejected alternatives:

- Full contract replacement: cleaner long term, but higher risk because it would touch more assessment, dashboard, and report consumers.
- Prototype-only sidecar: safe for experimentation, but it would not actually refactor the product gait implementation.

## Current Code Context

Owned motion files:

- `src/lib/sensors/**`
- `src/types/motion.ts`
- `src/components/assessment/MotionSensorStatus.tsx`

Approved light-touch shared/UI edits:

- `src/types/assessment.ts`
- `src/components/assessment/screens/GaitScreen.tsx`

Current gait implementation:

- `src/lib/sensors/browser-motion.ts` captures `devicemotion` samples.
- `src/lib/sensors/gait-cycle.ts` detects magnitude peaks.
- `src/lib/sensors/gait-metrics.ts` computes heuristic rhythm, stability, cadence, speed estimate, and quality.
- `src/lib/sensors/motion-summary.ts` maps detailed gait metrics into `MotionMetrics`.
- `src/lib/functional-tests/gates.ts` blocks floor-rising when gait is stopped, low-stability, or low-rhythm.

## Architecture

Internal reconstruction flow:

```txt
MotionSample[]
  -> validateGaitCapture()
  -> resample to 50 Hz
  -> signed-channel correlation segmentation
  -> magnitude step detector cross-check
  -> full reconstruction when gyro is present
      -> gravity-anchored gyro attitude
      -> world-frame closed double integration
      -> PCA heading calibration
      -> cross-cycle aggregation
  -> reduced vertical-only reconstruction when gyro is absent
  -> assemble reconstruction result
  -> map to MotionMetrics
```

Public app boundary remains:

```txt
TestStartPanel
  -> startGaitCountdown()
  -> summarizeMotionSamples()
  -> MotionMetrics
```

## Capture Rules

`browser-motion.ts` should use `accelerationIncludingGravity` for gait samples. If a device does not expose acceleration including gravity, live capture should not silently fall back to `acceleration`, because that changes the signal characteristics. The resulting summary should be unavailable/stopped for accelerometer gait.

`rotationRate` remains optional:

- Present gyro: full reconstruction mode.
- Missing gyro: reduced mode, cadence and vertical-only shape where usable.

iOS motion permission remains tap-triggered through the existing guided pocket flow.

## Internal Modules

Add a new folder:

```txt
src/lib/sensors/gait-reconstruction/
```

Planned files:

- `types.ts`: internal `UniformSeries`, `CycleRepresentation`, `GaitReconstructionResult`.
- `resample.ts`: 50 Hz interpolation and gyro degrees/sec to radians/sec conversion.
- `segment.ts`: signed-channel correlation cycle segmentation.
- `attitude.ts`: gravity-anchored gyro integration using `gl-matrix`.
- `reconstruct.ts`: world-frame closed double integration.
- `heading.ts`: PCA heading calibration.
- `aggregate.ts`: canonical cycle averaging.
- `parameters.ts`: cadence, cycle variability, shape metrics, step/stride disambiguation, estimate labels.
- `analyze.ts`: orchestration, reduced mode, and failure classification.

The reconstruction code must not use Euler yaw subtraction before world-frame acceleration rotation. Heading invariance comes from relative orientation channels and PCA heading calibration.

## MotionMetrics Contract

Keep existing fields:

- `stabilityScore`
- `rhythmConsistency`
- `gaitSpeedMetersPerSecond`
- `estimatedGaitSpeedMetersPerSecond`
- `gaitSpeedEstimateSource`
- `stepCount`
- `cadenceStepsPerMinute`
- `stepTimeMeanSeconds`
- `stepTimeVariability`
- `jerkVariability`
- `rotationVariability`
- `cycleQualityScore`
- `completionStatus`
- `source`

Add optional fields only:

```ts
analysisMode?: "heuristic" | "reconstruction_full" | "reconstruction_reduced";
absoluteEstimateMethod?: "height_regression" | "course_distance" | "none";
trajectoryShape?: {
  verticalExcursionM?: number;
  forwardExcursionM?: number;
  lateralSwayM?: number;
  pathLengthM?: number;
  symmetry?: number;
};
```

These fields are optional so older records, demo records, manual entries, and existing dashboard consumers remain compatible.

## Speed And Distance Semantics

Default v1 UX remains the current 25-second timed pocket walk.

Speed semantics:

- If `distanceMeters` is provided, `gaitSpeedMetersPerSecond` uses known course distance over elapsed time and `absoluteEstimateMethod` is `course_distance`.
- If only `stepLengthMeters` is provided, speed remains a height-regression estimate and `absoluteEstimateMethod` is `height_regression`.
- If neither distance nor step length is available, absolute speed fields are omitted and `absoluteEstimateMethod` is `none`.

The UI should label non-distance speed as estimated. The app must not imply reconstructed horizontal loop extent is a measured stride length.

## Fallbacks And Safety

Failure behavior:

- Invalid duration, low sample count, low sample rate, static signal, or too few cycles returns stopped accelerometer metrics.
- Reconstruction exceptions fall back to the existing heuristic path only if the heuristic path passes capture quality and step count requirements.
- If both reconstruction and heuristic paths fail, return stopped accelerometer metrics.

Mode behavior:

- Full mode uses reconstruction-derived cycle timing, cadence, trajectory shape, and symmetry where available, with heuristic QC scores retained.
- Reduced mode uses cadence, rhythm/stability QC, and vertical-only shape metrics. Forward, lateral, and symmetry fields are omitted.
- Manual, demo, stopped, and unavailable paths remain unchanged.

Safety gate behavior:

- `getMotionGate()` continues to evaluate `completionStatus`, `stabilityScore`, and `rhythmConsistency`.
- A stopped or unstable gait result continues to block floor-rising.
- No reconstruction detail should override a failed safety gate.

## UI Changes

`src/components/assessment/screens/GaitScreen.tsx` should make estimate semantics visible without expanding the screen much.

Planned result/status adjustments:

- Show "Estimated speed" when speed comes from height-regression.
- Show "Course speed" when a known distance is provided.
- Show analysis mode as "Full sensor", "Reduced sensor", or "Heuristic".
- Show one optional shape tile, such as vertical motion or symmetry, only when available.

Dashboard and report views can continue using existing motion fields. If they need type compatibility edits, keep them minimal and copy-neutral.

## Testing Strategy

Add Bun unit tests for the new core:

- `gait-resample.test.ts`: uneven timestamps produce a uniform 50 Hz series; gyro channels convert from degrees/sec to radians/sec.
- `gait-segment.test.ts`: signed correlation segmentation finds stable cycles and avoids half-stride collapse on synthetic data.
- `gait-reconstruction.test.ts`: synthetic gait recovers expected cycle time, cadence, and reasonable vertical/forward/lateral excursions; vertical excursion guards against the yaw-removal inflation bug.
- `motion-summary.test.ts`: full, reduced, heuristic fallback, and failed reconstruction map safely into `MotionMetrics`.

Existing tests stay useful:

- `gait-cycle.test.ts`
- `gait-metrics.test.ts`
- `gait-protocol.test.ts`
- `direct-gait-flow.test.ts`

Verification commands:

```bash
bun test tests/unit
bun run lint
bun run build
```

## Risks

- Browser `rotationRate` axis conventions differ across iOS and Android. The implementation should isolate axis mapping so sign fixes can be tested without changing reconstruction math.
- Correlation segmentation may be sensitive to loose-pocket movement. The magnitude detector remains a QC cross-check to avoid over-trusting reconstruction.
- Height-regression speed is systematically weak for impaired gait. The UI and data model must label it as an estimate.
- Full reconstruction requires enough repeated cycles. Short or noisy captures should fail closed into stopped/unavailable metrics rather than pass.

## Implementation Boundaries

Do not modify:

- `src/lib/vision/**`
- clinical copy
- recommendation thresholds
- floor-rising gate logic
- dashboard/report behavior beyond minimal type compatibility

Allowed implementation touch points:

- `src/lib/sensors/**`
- `src/types/motion.ts` if capture metadata needs it
- `src/types/assessment.ts` for optional `MotionMetrics` fields
- `src/components/assessment/screens/GaitScreen.tsx` for light result-label updates
- `tests/unit/**` for new and updated tests

## Acceptance Criteria

- Existing demo/manual/stopped gait paths still work.
- Invalid live captures return stopped accelerometer metrics.
- Full-mode synthetic gait passes reconstruction assertions.
- Reduced-mode synthetic or fixture gait produces cadence and vertical-only metrics without pretending to have horizontal trajectory.
- The gait screen labels non-distance speed as estimated.
- Floor-rising remains blocked after stopped or unstable gait.
- `bun test tests/unit`, `bun run lint`, and `bun run build` pass.
