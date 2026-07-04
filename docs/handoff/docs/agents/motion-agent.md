# Motion Sensor Agent

## Goal

Build the smartphone accelerometer / motion sensor capture module and summarise derived metrics for the chair stand assessment.

## Context from Shaun’s brief

Physio-Aid is a web-based physiotherapy support platform focused on prolonging healthspan by preventing frailty progression and falls in older adults. The brief centres the MVP on safety screening, falls efficacy, chair stand assessment, sensor/CV analytics, an ability–confidence profile, risk stratification, recommendations, and linkage to Active Ageing Centres, Community Health Posts, or Physiotherapy Clinics. The tool is decision support, not diagnosis. The brief includes smartphone accelerometer input as a core technical component. For the hackathon, derived metrics should support the chair stand pathway and must gracefully fail when browser/device permissions are unavailable.

## Responsibilities

- Request motion sensor permission where required.
- Capture acceleration samples during the chair stand window.
- Summarise samples into simple derived metrics.
- Return unavailable/manual/demo states without breaking analytics.
- Avoid storing raw high-frequency data unless needed for temporary processing.
- Document browser/device limitations.

## Inputs

- Assessment start/stop events
- DeviceMotion or DeviceOrientation browser data
- Manual/demo fallback values
- Chair stand timing window

## Outputs

- `MotionMetrics` object
- Sensor availability status
- Permission status
- Optional debug summary for demo

## Files it owns

- `src/lib/sensors/accelerometer.ts`
- `src/lib/sensors/motion-summary.ts`
- `src/components/assessment/MotionSensorStatus.tsx`
- `src/types/motion.ts`
- `tests/unit/motion-summary.test.ts`

## Files it must not edit

- `src/lib/vision/**`
- `src/lib/analytics/**` except type imports
- `src/content/**`
- `src/components/dashboard/**`
- Clinical and recommendation copy

## Integration contract

The motion agent must return:

```ts
type MotionMetrics = {
  available: boolean;
  sampleCount: number;
  stabilityIndex?: number;
  rhythmConsistency?: number;
  peakAcceleration?: number;
  source: "device_motion" | "manual" | "demo" | "unavailable";
};
```

The analytics engine must be able to run even if `available` is false.

## Acceptance criteria

- Motion permission flow does not block the full demo.
- Unsupported browsers return a safe unavailable state.
- Derived metrics are produced from captured samples when available.
- No raw sensor stream is persisted by default.
- Manual/demo fallback works.
- The module can be started and stopped by the chair stand step.

## What not to build

- Do not build a native mobile app.
- Do not require accelerometer support for the MVP to work.
- Do not claim sensor metrics are clinically validated.
- Do not store raw movement streams permanently by default.
- Do not edit computer vision detection logic.
