import {
  accelerationMagnitude,
  rms,
  validMotionSamples,
} from "@/lib/sensors/gait-protocol";
import type { MotionSample } from "@/types/motion";

const DEFAULT_LOW_MOTION_RANGE = 0.22;
const DEFAULT_LOW_ROTATION_RMS = 25;
const DEFAULT_MOVEMENT_WINDOW_MS = 1200;
const DEFAULT_MOVEMENT_RANGE = 0.55;
const DEFAULT_MOVEMENT_ROTATION_RMS = 30;

export type StandstillAutoStopDetector = {
  addSample: (sample: MotionSample) => void;
  reset: () => void;
};

export function createStandstillAutoStopDetector(options: {
  requiredStillMs: number;
  onStandstill: (sample: MotionSample) => void;
  lowMotionRange?: number;
  lowRotationRms?: number;
  movementWindowMs?: number;
  movementRange?: number;
  movementRotationRms?: number;
}): StandstillAutoStopDetector {
  const requiredStillMs = Math.max(500, options.requiredStillMs);
  const lowMotionRange = options.lowMotionRange ?? DEFAULT_LOW_MOTION_RANGE;
  const lowRotationRms = options.lowRotationRms ?? DEFAULT_LOW_ROTATION_RMS;
  const movementWindowMs =
    options.movementWindowMs ?? DEFAULT_MOVEMENT_WINDOW_MS;
  const movementRange = options.movementRange ?? DEFAULT_MOVEMENT_RANGE;
  const movementRotationRms =
    options.movementRotationRms ?? DEFAULT_MOVEMENT_ROTATION_RMS;
  const retentionMs = Math.max(requiredStillMs, movementWindowMs) + 500;

  let samples: MotionSample[] = [];
  let walkingDetected = false;
  let finished = false;

  function reset() {
    samples = [];
    walkingDetected = false;
    finished = false;
  }

  function addSample(sample: MotionSample) {
    if (finished || validMotionSamples([sample]).length === 0) {
      return;
    }

    samples.push(sample);
    samples = samples.filter(
      (candidate) => sample.timestampMs - candidate.timestampMs <= retentionMs,
    );

    if (!walkingDetected) {
      const movementWindow = windowEndingAt(sample.timestampMs, movementWindowMs);
      if (
        movementWindow.length > 1 &&
        (accelerationRange(movementWindow) >= movementRange ||
          rotationRms(movementWindow) >= movementRotationRms)
      ) {
        walkingDetected = true;
      }
      return;
    }

    const stillWindow = windowEndingAt(sample.timestampMs, requiredStillMs);
    const actualWindowMs =
      (stillWindow.at(-1)?.timestampMs ?? sample.timestampMs) -
      (stillWindow[0]?.timestampMs ?? sample.timestampMs);

    if (
      actualWindowMs >= requiredStillMs * 0.9 &&
      accelerationRange(stillWindow) <= lowMotionRange &&
      rotationRms(stillWindow) <= lowRotationRms
    ) {
      finished = true;
      options.onStandstill(sample);
    }
  }

  function windowEndingAt(endMs: number, durationMs: number): MotionSample[] {
    return samples.filter((candidate) => endMs - candidate.timestampMs <= durationMs);
  }

  return { addSample, reset };
}

function accelerationRange(samples: MotionSample[]): number {
  if (samples.length === 0) return 0;
  const magnitudes = samples.map(accelerationMagnitude);
  return Math.max(...magnitudes) - Math.min(...magnitudes);
}

function rotationRms(samples: MotionSample[]): number {
  return rms(
    samples.map((sample) =>
      Math.hypot(
        sample.rotationAlpha ?? 0,
        sample.rotationBeta ?? 0,
        sample.rotationGamma ?? 0,
      ),
    ),
  );
}
