import type { UniformSeries } from "@/lib/sensors/gait-reconstruction/types";
import type { MotionSample } from "@/types/motion";

export const TARGET_GAIT_FS = 50;

export function resampleGaitSeries(
  samples: MotionSample[],
  targetFs = TARGET_GAIT_FS,
): UniformSeries {
  if (samples.length === 0) {
    return { fs: targetFs, accel: new Float64Array(0), gyro: null, n: 0 };
  }

  const sorted = [...samples].sort((a, b) => a.timestampMs - b.timestampMs);
  const t0 = sorted[0].timestampMs;
  const t1 = sorted[sorted.length - 1].timestampMs;
  const durationSeconds = Math.max(0, (t1 - t0) / 1000);
  const n = Math.floor(durationSeconds * targetFs) + 1;
  const accel = new Float64Array(n * 3);
  const hasGyro = sorted.every(
    (sample) =>
      sample.rotationAlpha !== undefined &&
      sample.rotationBeta !== undefined &&
      sample.rotationGamma !== undefined,
  );
  const gyro = hasGyro ? new Float64Array(n * 3) : null;
  const degToRad = Math.PI / 180;

  let j = 0;
  for (let i = 0; i < n; i += 1) {
    const t = t0 + (i / targetFs) * 1000;
    while (j < sorted.length - 2 && sorted[j + 1].timestampMs < t) {
      j += 1;
    }

    const a = sorted[j];
    const b = sorted[j + 1] ?? sorted[j];
    const span = b.timestampMs - a.timestampMs || 1;
    const weight = Math.min(1, Math.max(0, (t - a.timestampMs) / span));
    const base = i * 3;

    accel[base] = lerp(a.accelerationX, b.accelerationX, weight);
    accel[base + 1] = lerp(a.accelerationY, b.accelerationY, weight);
    accel[base + 2] = lerp(a.accelerationZ, b.accelerationZ, weight);

    if (gyro) {
      gyro[base] = lerp(a.rotationBeta!, b.rotationBeta!, weight) * degToRad;
      gyro[base + 1] =
        lerp(a.rotationGamma!, b.rotationGamma!, weight) * degToRad;
      gyro[base + 2] =
        lerp(a.rotationAlpha!, b.rotationAlpha!, weight) * degToRad;
    }
  }

  return { fs: targetFs, accel, gyro, n };
}

function lerp(a: number, b: number, weight: number) {
  return a + weight * (b - a);
}
