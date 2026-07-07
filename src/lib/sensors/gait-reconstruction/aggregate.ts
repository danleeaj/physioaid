import type { CycleRepresentation } from "@/lib/sensors/gait-reconstruction/types";

export function aggregateCycles(
  cycles: CycleRepresentation[],
): CycleRepresentation {
  const length = cycles[0]?.disp.length ?? 0;
  const disp = new Float64Array(length);
  const ori = new Float64Array(length);

  for (const cycle of cycles) {
    for (let i = 0; i < length; i += 1) {
      disp[i] += cycle.disp[i];
      ori[i] += cycle.ori[i];
    }
  }

  if (cycles.length > 0) {
    for (let i = 0; i < length; i += 1) {
      disp[i] /= cycles.length;
      ori[i] /= cycles.length;
    }
  }

  return { disp, ori };
}
