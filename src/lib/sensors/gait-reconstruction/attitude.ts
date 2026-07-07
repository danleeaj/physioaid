import { mat3, quat, vec3 } from "gl-matrix";
import type { UniformSeries } from "@/lib/sensors/gait-reconstruction/types";

const WORLD_DOWN = vec3.fromValues(0, -1, 0);

export function cycleAttitude(
  series: UniformSeries,
  p0: number,
  p1: number,
): Float32Array {
  const { fs, accel, gyro } = series;
  const dt = 1 / fs;
  const length = p1 - p0;
  const out = new Float32Array(length * 9);
  const alpha = Math.exp((-2 * Math.PI * 0.3) / fs);
  const gravity = cycleMeanAcceleration(accel, p0, p1);
  const deviceDown = vec3.normalize(
    vec3.create(),
    vec3.negate(vec3.create(), gravity),
  );
  const q = quat.rotationTo(quat.create(), deviceDown, WORLD_DOWN);

  for (let i = 0; i < length; i += 1) {
    const index = p0 + i;
    gravity[0] = alpha * gravity[0] + (1 - alpha) * accel[index * 3];
    gravity[1] = alpha * gravity[1] + (1 - alpha) * accel[index * 3 + 1];
    gravity[2] = alpha * gravity[2] + (1 - alpha) * accel[index * 3 + 2];

    if (gyro) {
      const wx = gyro[index * 3];
      const wy = gyro[index * 3 + 1];
      const wz = gyro[index * 3 + 2];
      const magnitude = Math.hypot(wx, wy, wz);
      if (magnitude > 1e-8) {
        const dq = quat.setAxisAngle(
          quat.create(),
          vec3.fromValues(wx / magnitude, wy / magnitude, wz / magnitude),
          magnitude * dt,
        );
        quat.multiply(q, q, dq);
      }
    }

    const measuredDown = vec3.normalize(
      vec3.create(),
      vec3.negate(vec3.create(), gravity),
    );
    const predictedDown = vec3.transformQuat(vec3.create(), measuredDown, q);
    const correction = quat.rotationTo(quat.create(), predictedDown, WORLD_DOWN);
    quat.slerp(correction, quat.create(), correction, 0.02);
    quat.multiply(q, correction, q);
    quat.normalize(q, q);

    out.set(mat3.fromQuat(mat3.create(), q), i * 9);
  }

  return out;
}

function cycleMeanAcceleration(
  accel: Float64Array,
  p0: number,
  p1: number,
) {
  const gravity = vec3.create();
  const length = Math.max(1, p1 - p0);

  for (let index = p0; index < p1; index += 1) {
    gravity[0] += accel[index * 3];
    gravity[1] += accel[index * 3 + 1];
    gravity[2] += accel[index * 3 + 2];
  }

  gravity[0] /= length;
  gravity[1] /= length;
  gravity[2] /= length;

  return gravity;
}
