# Computer Vision Agent

## Goal

Build the camera-based chair stand assessment module and output derived functional metrics for the ability–confidence engine.

## Context from Shaun’s brief

Physio-Aid is a web-based physiotherapy support platform focused on prolonging healthspan by preventing frailty progression and falls in older adults. The brief centres the MVP on safety screening, falls efficacy, chair stand assessment, sensor/CV analytics, an ability–confidence profile, risk stratification, recommendations, and linkage to Active Ageing Centres, Community Health Posts, or Physiotherapy Clinics. The tool is decision support, not diagnosis. The brief prioritises camera-based movement capture and chair stand as the core MVP functional test. Gait speed and floor rising are optional extensions.

## Responsibilities

- Create camera preview and capture flow.
- Guide user through chair stand setup.
- Detect or estimate chair stand repetitions and duration where feasible.
- Return derived metrics and quality flags.
- Provide manual/demo fallback if detection fails.
- Avoid raw video storage by default.

## Inputs

- Browser camera stream
- Start/stop test events
- Manual timing or demo fixture
- Motion module timing if available

## Outputs

- `ChairStandMetrics` object
- `VisionMetrics` object if separate
- Quality flags
- Detection confidence or fallback state

## Files it owns

- `src/lib/vision/chair-stand.ts`
- `src/lib/vision/video-metrics.ts`
- `src/components/assessment/ChairStandCapture.tsx`
- `src/components/assessment/CameraSetup.tsx`
- `src/types/vision.ts`
- `tests/unit/chair-stand.test.ts`

## Files it must not edit

- `src/lib/sensors/**`
- `src/lib/analytics/**` except type imports
- `src/content/**`
- `src/server/storage/**` unless storage handling is explicitly coordinated
- Questionnaire files

## Integration contract

The CV agent must provide:

```ts
type ChairStandMetrics = {
  completed: boolean;
  repetitions: number;
  durationSeconds: number;
  usedArmSupport?: boolean;
  stoppedEarly?: boolean;
  qualityFlags: string[];
  source: "camera" | "manual" | "demo";
};

type VisionMetrics = {
  available: boolean;
  repetitionsDetected?: number;
  durationSeconds?: number;
  confidence?: number;
  qualityFlags: string[];
  source: "camera" | "manual" | "demo" | "unavailable";
};
```

The analytics engine consumes `ChairStandMetrics` and optionally `VisionMetrics`.

## Acceptance criteria

- Camera setup screen is clear and safe.
- Chair stand test can be completed with camera or fallback metrics.
- Derived metrics are returned in the expected contract.
- No raw video is stored by default.
- If detection confidence is low, the UI asks for manual confirmation or uses demo fallback.
- Chair stand works before any optional gait or floor rising work begins.

## What not to build

- Do not prioritise gait speed or floor rising over chair stand.
- Do not build raw video upload/storage by default.
- Do not claim clinical-grade CV accuracy.
- Do not require perfect pose detection for the demo.
- Do not edit questionnaire or clinical recommendation wording.
