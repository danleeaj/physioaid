import type { MotionSample } from "../../../src/types/motion";

export function syntheticClosedLoopGait(options?: {
  fs?: number;
  seconds?: number;
  cycleSeconds?: number;
  forwardExcursionM?: number;
  verticalExcursionM?: number;
  lateralExcursionM?: number;
  includeGyro?: boolean;
}): MotionSample[] {
  const fs = options?.fs ?? 50;
  const seconds = options?.seconds ?? 25;
  const cycleSeconds = options?.cycleSeconds ?? 1.1;
  const forwardExcursionM = options?.forwardExcursionM ?? 0.7;
  const verticalExcursionM = options?.verticalExcursionM ?? 0.06;
  const lateralExcursionM = options?.lateralExcursionM ?? 0.04;
  const includeGyro = options?.includeGyro ?? true;
  const angularFrequency = (2 * Math.PI) / cycleSeconds;
  const sampleCount = Math.floor(seconds * fs);

  return Array.from({ length: sampleCount }, (_, index) => {
    const t = index / fs;
    const phase = angularFrequency * t;
    const accelerationX =
      -0.5 *
      forwardExcursionM *
      angularFrequency *
      angularFrequency *
      Math.sin(phase);
    const accelerationY =
      9.81 +
      0.5 *
        verticalExcursionM *
        angularFrequency *
        angularFrequency *
        Math.cos(phase);
    const accelerationZ =
      -0.5 *
      lateralExcursionM *
      angularFrequency *
      angularFrequency *
      Math.sin(phase + Math.PI / 4);

    return {
      timestampMs: t * 1000,
      accelerationX,
      accelerationY,
      accelerationZ,
      rotationAlpha: includeGyro ? 0 : undefined,
      rotationBeta: includeGyro ? 0 : undefined,
      rotationGamma: includeGyro ? 0 : undefined,
    };
  });
}
