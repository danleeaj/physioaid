# Short Active Pocket Gait Design

Date: 2026-07-07
Branch: feature/daniel-motion-tests

## Summary

Physio-Aid will replace the current distance-first gait walk behavior with a short active pocket walk that is closer to the publicly described OneStep active-walk workflow while staying inside Physio-Aid's decision-support, safety-gated, derived-metrics-only boundaries.

The participant will place the phone in a front pocket, stand still for a short baseline, wait through a countdown, then walk at their usual safe pace for a 25 second target window. Runs from 20 to 30 seconds are accepted to allow early participant stop after 20 seconds, browser timer jitter, and manual fallback entry. Shorter runs, insufficient sample quality, permission denial, or participant discomfort fall back to manual entry, demo metrics, or "stopped or unstable" without blocking completion of the overall assessment. Unsafe or stopped gait still blocks floor-rising.

This is a clean-room, public-method-inspired design. It must not claim to copy OneStep's proprietary model weights, labeled dataset, FDA status, validation status, or exact algorithms.

## Research Basis

Public OneStep materials describe a smartphone-only gait system that uses a phone carried in a pocket, requires no external wearable, and returns gait and mobility insights from phone motion data. OneStep's product page describes a "motion lab in your pocket," active or background movement capture, 30+ gait parameters, and a Motion SDK/API based on built-in orientation and acceleration sensors.

A 2024 Sensors validation paper describes the OneStep application as using the smartphone IMU to measure acceleration and orientation in three dimensions at 100 Hz. The paper says OneStep converts raw IMU signals into a digital walk representation, segments gait cycles, constrains each cycle into a drift-resistant closed-form 6DOF trajectory, normalizes each cycle into a 6 x 100 matrix, then uses convolutional regression models trained on labeled gait data to estimate spatiotemporal gait parameters.

Physio-Aid can approximate the observable behavior with browser DeviceMotion data, deterministic signal processing, and optional future model training. It cannot reproduce OneStep's proprietary data, model weights, validation evidence, or medical-device claims.

Sources:

- https://www.onestep.co/product
- https://www.mdpi.com/1424-8220/24/11/3594
- https://patents.google.com/patent/US20200289027A1/en
- https://www.sciencedirect.com/science/article/abs/pii/S0268003322001851
- https://www.onestep.co/resources/faq

## Goals

- Make the gait test a short active 25 second pocket walk, with 20-30 seconds accepted for early stop, timer jitter, or manual fallback entry.
- Improve similarity to OneStep's active-walk workflow by collecting enough cycles for rhythm and stability analysis.
- Use phone IMU samples already available through browser DeviceMotion events.
- Store only derived gait metrics in the assessment draft and saved session.
- Preserve manual, demo, stopped, and unavailable fallbacks.
- Preserve the safety gate: stopped or unstable gait must block floor-rising.
- Keep clinical language as decision support, not diagnosis or validated fall-risk prediction.

## Non-Goals

- No passive or background monitoring in this version.
- No 10 minute walking session.
- No new production dependency unless explicitly approved.
- No raw high-frequency IMU storage by default.
- No exact reproduction of OneStep's proprietary ML model.
- No claims of clinical validation, FDA listing, diagnosis, prescription, or autonomous medical advice.

## User Protocol

1. The participant starts from a safe standing position.
2. The app requests motion permission from a user tap.
3. The app gives an audio cue to place the phone in a front pocket.
4. The app captures a short standing baseline.
5. The app counts down.
6. The participant walks at a usual safe pace for 25 seconds.
7. The app auto-stops by timer.
8. The app immediately summarizes samples into derived gait metrics.
9. The participant can use manual entry, demo gait, or stopped/unstable if the sensor path fails or feels unsafe.

The UI may still collect optional course distance for gait speed, but the primary capture should be time-based rather than distance auto-stop. If no course distance is available, gait speed is estimated from step count multiplied by estimated step length divided by elapsed time.

## Architecture

The gait engine should live in Daniel-owned motion files under `src/lib/sensors/` and remain independent of UI components.

Recommended modules:

- `gait-protocol.ts`: constants and checks for target duration, accepted duration window, minimum sample count, minimum sample rate, and quality labels.
- `gait-cycle.ts`: resampling, baseline removal, smoothing, peak detection, step/cycle segmentation, and cycle timing.
- `gait-metrics.ts`: derived gait metrics from samples and detected cycles.
- Existing `motion-summary.ts`: becomes the compatibility facade that returns the app's `MotionMetrics` contract.

The UI should continue to use `TestStartPanel` and `GaitScreen`, but `GaitScreen` should configure the walk as a 25 second timed run instead of using distance auto-stop as the default completion mechanism.

## Data Flow

The data flow remains local and derived-metrics-first:

1. `TestStartPanel` collects active walking samples between countdown completion and timer auto-stop.
2. `useAssessmentFlow.startGaitCountdown` passes active samples and elapsed seconds into the gait summary facade.
3. The summary facade validates duration and sample quality.
4. The gait engine computes cycles and derived metrics.
5. The facade maps detailed gait metrics onto `MotionMetrics`.
6. The assessment draft stores only derived metrics.
7. `getMotionGate` continues to decide whether floor-rising is unlocked.

Permission denial, unsupported browser APIs, low sample rate, static samples, or too few valid cycles should return a stopped or unavailable motion result rather than silently creating a passing result.

## Metrics

The initial automatic summary should compute:

- `stepCount`
- `cadenceStepsPerMinute`
- `stepTimeMeanSeconds`
- `stepTimeVariability`
- `rhythmConsistency`
- `stabilityScore`
- `jerkVariability`
- `rotationVariability`
- `cycleQualityScore`
- optional `estimatedGaitSpeedMetersPerSecond`

The existing high-level assessment behavior should continue to depend on:

- `stabilityScore`
- `rhythmConsistency`
- `gaitSpeedMetersPerSecond`, when available
- `completionStatus`
- `source`

`MotionMetrics` may be expanded with optional fields if needed. Any contract changes to `src/types/assessment.ts` must be called out because it is a shared file.

## Metric Semantics

`rhythmConsistency` should reflect regularity of detected step or gait-cycle intervals. High rhythm means intervals are consistent enough for a short active walk; low rhythm means the detected walking pattern is irregular or sample quality is poor.

`stabilityScore` should reflect movement smoothness and control using acceleration variability, jerk, rotation variability, and cycle amplitude consistency. It is not a clinical balance diagnosis.

`cycleQualityScore` should be internal or secondary. It should combine sample rate, valid sample count, detected cycle count, walking/non-static confidence, and timing plausibility. It can help decide whether to show the gait metrics as usable, estimated, or unavailable.

`estimatedGaitSpeedMetersPerSecond` should be clearly treated as estimated when derived from step count and estimated step length. If an explicit course distance is provided, speed can be calculated as distance divided by elapsed time.

## Safety And Copy Boundaries

The gait screen must keep safety-first wording. It may say:

- "Walking pattern suggests caution."
- "The walk was stopped or unstable, so floor-rising will be skipped."
- "These metrics support a decision-support summary and do not diagnose a condition."

It must not say:

- "Clinically validated fall risk."
- "Diagnoses frailty."
- "Prescribes treatment."
- "Equivalent to OneStep."
- "FDA-listed" or any equivalent regulatory claim.

## Error Handling

The gait summary should return an unavailable or stopped result when:

- active duration is below 20 seconds;
- sample count is below the minimum needed for a 20 second walk;
- effective sample rate is too low for reliable step timing;
- there are too few detected steps or cycles;
- the signal is static during the active phase;
- values are non-finite or corrupted.

The UI should continue to let the participant finish the assessment with manual or demo fallbacks. A failed gait result should not crash the flow or prevent the final result page.

## Testing

Focused unit tests should cover:

- accepted 20, 25, and 30 second durations;
- rejection of too-short runs;
- rejection of static or near-static samples;
- rejection of low sample counts and low sample rates;
- regular synthetic walking cycles producing high rhythm consistency;
- irregular synthetic cycles producing lower rhythm consistency;
- high jerk or high rotation variability reducing stability score;
- optional gait speed from explicit distance;
- estimated gait speed from step count and estimated step length;
- preservation of existing gate behavior for stopped or unstable gait.

Manual verification should include:

- iPhone Safari over HTTPS, because motion permission requires a user gesture;
- Android Chrome where motion permission behavior may differ;
- permission denied fallback;
- no motion support fallback;
- complete demo path still reaching the dashboard;
- unsafe gait still blocking floor-rising.

## Implementation Notes

This design should be implemented without new production dependencies unless a specific need is identified and confirmed. Standard numeric helpers are sufficient for the initial deterministic version.

The current `motion-summary.ts` already computes high-level rhythm and stability from acceleration magnitude, step intervals, jerk, and rotation. The implementation should evolve that logic into clearer, testable gait modules rather than replacing it with a large opaque function.

The current `TestStartPanel` already supports timed auto-complete and guided pocket mode. The gait screen should use those existing capabilities for the 25 second active walk and avoid making distance auto-stop the default completion condition.

## Review Checklist

- The gait protocol is short: target 25 seconds, accepted 20-30 seconds.
- Raw IMU samples are not stored by default.
- The design stays inside Daniel's motion ownership area except for coordinated UI/type changes.
- Manual, demo, stopped, and unavailable fallbacks remain.
- Unsafe or stopped gait blocks floor-rising.
- The implementation is a clean-room approximation of public OneStep behavior, not a proprietary clone.
