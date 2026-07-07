import { mat3, quat, vec3 } from "gl-matrix";
import type {
  CycleRepresentation,
  UniformSeries,
} from "@/lib/sensors/gait-reconstruction/types";

const PHASE_UNITS = 100;

export function reconstructCycle(
  series: UniformSeries,
  attitude: Float32Array,
  p0: number,
  p1: number,
): CycleRepresentation {
  const length = p1 - p0;
  const worldAccel = new Float64Array(length * 3);

  for (let i = 0; i < length; i += 1) {
    const m = mat3.clone(
      attitude.subarray(i * 9, i * 9 + 9) as unknown as mat3,
    );
    const a = vec3.fromValues(
      series.accel[(p0 + i) * 3],
      series.accel[(p0 + i) * 3 + 1],
      series.accel[(p0 + i) * 3 + 2],
    );
    vec3.transformMat3(a, a, m);
    worldAccel[i * 3] = a[0];
    worldAccel[i * 3 + 1] = a[1];
    worldAccel[i * 3 + 2] = a[2];
  }

  const disp = closedDoubleIntegrate(worldAccel, length, 1 / series.fs);
  const ori = relativeOrientation(attitude, length);
  return {
    disp: resampleChannels(disp, length, PHASE_UNITS),
    ori: resampleChannels(ori, length, PHASE_UNITS),
  };
}

function closedDoubleIntegrate(
  accel: Float64Array,
  length: number,
  dt: number,
): Float64Array {
  const disp = new Float64Array(length * 3);

  for (let axis = 0; axis < 3; axis += 1) {
    const a = new Float64Array(length);
    const v = new Float64Array(length);
    const d = new Float64Array(length);
    let accelMean = 0;
    for (let i = 0; i < length; i += 1) accelMean += accel[i * 3 + axis];
    accelMean /= length;
    for (let i = 0; i < length; i += 1) a[i] = accel[i * 3 + axis] - accelMean;
    for (let i = 1; i < length; i += 1) {
      v[i] = v[i - 1] + 0.5 * (a[i] + a[i - 1]) * dt;
    }
    const velocityMean = mean(v);
    for (let i = 0; i < length; i += 1) v[i] -= velocityMean;
    for (let i = 1; i < length; i += 1) {
      d[i] = d[i - 1] + 0.5 * (v[i] + v[i - 1]) * dt;
    }
    for (let i = 0; i < length; i += 1) disp[i * 3 + axis] = d[i] - d[0];
  }

  return disp;
}

function relativeOrientation(attitude: Float32Array, length: number): Float64Array {
  const mid = mat3.clone(
    attitude.subarray((length >> 1) * 9, (length >> 1) * 9 + 9) as unknown as mat3,
  );
  const meanInv = quat.invert(quat.create(), quat.fromMat3(quat.create(), mid));
  const out = new Float64Array(length * 3);

  for (let i = 0; i < length; i += 1) {
    const m = mat3.clone(
      attitude.subarray(i * 9, i * 9 + 9) as unknown as mat3,
    );
    const qr = quat.multiply(
      quat.create(),
      meanInv,
      quat.fromMat3(quat.create(), m),
    );
    quat.normalize(qr, qr);
    const angle = 2 * Math.acos(Math.min(1, Math.abs(qr[3])));
    const scale = angle > 1e-6 ? angle / Math.sin(angle / 2) : 0;
    out[i * 3] = qr[0] * scale;
    out[i * 3 + 1] = qr[1] * scale;
    out[i * 3 + 2] = qr[2] * scale;
  }

  return out;
}

function resampleChannels(
  values: Float64Array,
  fromLength: number,
  toLength: number,
): Float64Array {
  const out = new Float64Array(toLength * 3);
  if (fromLength === 0) return out;

  for (let i = 0; i < toLength; i += 1) {
    const position = (i / (toLength - 1)) * (fromLength - 1);
    const left = Math.floor(position);
    const right = Math.min(fromLength - 1, left + 1);
    const weight = position - left;
    for (let axis = 0; axis < 3; axis += 1) {
      out[i * 3 + axis] =
        values[left * 3 + axis] +
        weight * (values[right * 3 + axis] - values[left * 3 + axis]);
    }
  }

  return out;
}

function mean(values: Float64Array): number {
  let total = 0;
  for (const value of values) total += value;
  return values.length ? total / values.length : 0;
}
