export type UniformSeries = {
  fs: number;
  accel: Float64Array;
  gyro: Float64Array | null;
  n: number;
};

export type CycleRepresentation = {
  disp: Float64Array;
  ori: Float64Array;
};

export type TrajectoryShape = {
  verticalExcursionM?: number;
  forwardExcursionM?: number;
  lateralSwayM?: number;
  pathLengthM?: number;
  symmetry?: number;
};

export type GaitReconstructionResult = {
  completionStatus: "completed" | "stopped";
  mode: "full" | "reduced" | "heuristic";
  cycleCount: number;
  cycleTimeS?: number;
  cycleTimeVariabilityS?: number;
  cadenceStepsPerMinute?: number;
  stepsPerCycle?: 1 | 2;
  canonical: CycleRepresentation | null;
  perCycle: CycleRepresentation[];
  shape: TrajectoryShape;
  quality: number;
  failureReason?: string;
};
