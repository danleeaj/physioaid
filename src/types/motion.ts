export type MotionPermissionState =
  | "unknown"
  | "not_supported"
  | "prompt_required"
  | "granted"
  | "denied";

export type MotionSupportStatus = {
  supported: boolean;
  permissionState: MotionPermissionState;
  requiresUserGesture: boolean;
  message: string;
};

export type MotionSample = {
  timestampMs: number;
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  rotationAlpha?: number;
  rotationBeta?: number;
  rotationGamma?: number;
};
