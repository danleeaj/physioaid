import type { CycleRepresentation } from "@/lib/sensors/gait-reconstruction/types";

export function calibrateHeading(
  rep: CycleRepresentation,
): CycleRepresentation {
  const d = rep.disp;
  const n = d.length / 3;
  let mx = 0;
  let mz = 0;
  for (let i = 0; i < n; i += 1) {
    mx += d[i * 3];
    mz += d[i * 3 + 2];
  }
  mx /= n;
  mz /= n;

  let a = 0;
  let b = 0;
  let c = 0;
  for (let i = 0; i < n; i += 1) {
    const x = d[i * 3] - mx;
    const z = d[i * 3 + 2] - mz;
    a += x * x;
    b += x * z;
    c += z * z;
  }

  const theta = 0.5 * Math.atan2(2 * b, a - c);
  const fx = Math.cos(theta);
  const fz = Math.sin(theta);
  const rx = -fz;
  const rz = fx;
  const out = new Float64Array(n * 3);

  for (let i = 0; i < n; i += 1) {
    const x = d[i * 3];
    const y = d[i * 3 + 1];
    const z = d[i * 3 + 2];
    out[i * 3] = x * fx + z * fz;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = x * rx + z * rz;
  }

  return { disp: out, ori: rep.ori };
}
