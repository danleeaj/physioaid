# Motion And Camera Vision Scaffold

This scaffold keeps the demo flow stable while Daniel and Ezekiel replace manual/demo values with real browser sensor and camera-derived metrics.

## Rule

Real detection modules must return derived metrics only. Do not store raw high-frequency sensor streams or raw video by default.

## Shared Gate Logic

Safety gates live in:

```txt
src/lib/functional-tests/gates.ts
```

The assessment UI uses these helpers to decide whether the user can proceed:

- `getChairStandGate`
- `getMotionGate`
- `getFloorRisingGate`

If a detector marks a test as `stopped`, `unsafe`, unstable, or requiring assistance, the flow must skip higher-risk tests and continue to the dashboard.

## Daniel: Motion Sensor Work

Owned area:

```txt
src/lib/sensors/**
src/types/motion.ts
src/components/assessment/MotionSensorStatus.tsx
```

Current integration points:

- `src/lib/sensors/browser-motion.ts`
  - checks browser motion support
  - requests iPhone Safari motion permission from a user tap
- `src/lib/sensors/motion-summary.ts`
  - `summarizeMotionSamples`
  - `getDemoMotionMetrics`
  - `getUnavailableMotionMetrics`
- `src/components/assessment/MotionSensorStatus.tsx`
  - visible scaffold panel on the gait walking step

Expected output shape:

```ts
MotionMetrics {
  stabilityScore: number;
  rhythmConsistency: number;
  gaitSpeedMetersPerSecond?: number;
  completionStatus?: "completed" | "stopped" | "demo";
  source: "accelerometer" | "manual" | "demo";
}
```

For gait speed in the MVP, use known distance divided by measured time. Use sensor data for rhythm, cadence-like consistency, and stability.

## Ezekiel: Camera Vision Work

Owned area:

```txt
src/lib/vision/**
src/components/assessment/CameraSetup.tsx
```

Current integration points:

- `src/lib/vision/camera.ts`
  - checks browser camera support
  - requests preview stream from a user tap
  - stops preview tracks on cleanup
- `src/lib/vision/chair-stand.ts`
  - demo chair stand and vision fixtures
- `src/lib/vision/floor-rising.ts`
  - floor-rising camera placeholder and manual metric builder
- `src/components/assessment/CameraSetup.tsx`
  - visible scaffold panel on chair stand and floor-rising steps

Expected chair stand output:

```ts
ChairStandMetrics {
  completionStatus: "completed" | "stopped" | "demo";
  durationSeconds: number;
  repetitions: number;
  movementQuality?: "steady" | "variable" | "unsafe";
  source: "manual" | "demo" | "camera";
}
```

Expected floor-rising output:

```ts
FloorRisingMetrics {
  completionStatus: "completed" | "stopped" | "skipped" | "demo";
  durationSeconds?: number;
  requiredAssistance: boolean;
  movementQuality?: "steady" | "variable" | "unsafe" | "not_assessed";
  source: "manual" | "demo" | "camera";
}
```

## UI Contract

The assessment page should always keep these fallbacks:

- manual input
- demo input
- stopped or skipped state

Camera or motion permission denial must not block the end-to-end demo.

## Verification

Before opening a PR:

```txt
npm run lint
npm run build
```

Also check:

- dashboard still renders
- demo path still works
- no diagnosis language
- no clinical validation claim
- no raw video storage by default
- physical test fallbacks remain available
