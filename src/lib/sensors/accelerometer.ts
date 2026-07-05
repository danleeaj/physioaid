export type MotionAxis = "x" | "y" | "z";
export type RotationAxis = "alpha" | "beta" | "gamma";

export type MotionVector = Record<MotionAxis, number | null>;
export type RotationVector = Record<RotationAxis, number | null>;

export type MotionReading = {
  acceleration: MotionVector;
  accelerationIncludingGravity: MotionVector;
  rotationRate: RotationVector;
  interval: number | null;
  capturedAt: string;
};

export type OrientationReading = {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  absolute: boolean | null;
  capturedAt: string;
};

export type MotionSensorSupport = {
  hasDeviceMotion: boolean;
  hasDeviceOrientation: boolean;
  requiresMotionPermission: boolean;
  requiresOrientationPermission: boolean;
  isSecureContext: boolean;
  userAgent: string;
};

export type MotionSensorEnvironment = {
  DeviceMotionEvent?: unknown;
  DeviceOrientationEvent?: unknown;
  isSecureContext?: boolean;
  navigator?: {
    userAgent?: string;
  };
};

type PermissionConstructor = {
  requestPermission?: unknown;
};

type MotionPermissionResult = "granted" | "denied" | "unsupported";

export function getMotionSensorSupport(
  environment: MotionSensorEnvironment,
): MotionSensorSupport {
  const motionConstructor = environment.DeviceMotionEvent;
  const orientationConstructor = environment.DeviceOrientationEvent;

  return {
    hasDeviceMotion: typeof motionConstructor === "function",
    hasDeviceOrientation: typeof orientationConstructor === "function",
    requiresMotionPermission: hasRequestPermission(motionConstructor),
    requiresOrientationPermission: hasRequestPermission(orientationConstructor),
    isSecureContext: environment.isSecureContext === true,
    userAgent: environment.navigator?.userAgent ?? "Unavailable",
  };
}

export function getBrowserMotionSensorSupport(): MotionSensorSupport {
  if (typeof window === "undefined") {
    return getMotionSensorSupport({});
  }

  return getMotionSensorSupport(window);
}

export async function requestMotionPermission(): Promise<{
  motion: MotionPermissionResult;
  orientation: MotionPermissionResult;
}> {
  if (typeof window === "undefined") {
    return { motion: "unsupported", orientation: "unsupported" };
  }

  const motion = await requestPermissionFromConstructor(
    window.DeviceMotionEvent,
  );
  const orientation = await requestPermissionFromConstructor(
    window.DeviceOrientationEvent,
  );

  return { motion, orientation };
}

export function toMotionReading(
  event: DeviceMotionEvent,
  capturedAt = new Date().toISOString(),
): MotionReading {
  return {
    acceleration: toMotionVector(event.acceleration),
    accelerationIncludingGravity: toMotionVector(
      event.accelerationIncludingGravity,
    ),
    rotationRate: toRotationVector(event.rotationRate),
    interval: toNullableNumber(event.interval),
    capturedAt,
  };
}

export function toOrientationReading(
  event: DeviceOrientationEvent,
  capturedAt = new Date().toISOString(),
): OrientationReading {
  return {
    alpha: toNullableNumber(event.alpha),
    beta: toNullableNumber(event.beta),
    gamma: toNullableNumber(event.gamma),
    absolute:
      typeof event.absolute === "boolean" ? event.absolute : null,
    capturedAt,
  };
}

function hasRequestPermission(constructorValue: unknown) {
  return (
    typeof constructorValue === "function" &&
    typeof (constructorValue as PermissionConstructor).requestPermission ===
      "function"
  );
}

async function requestPermissionFromConstructor(
  constructorValue: unknown,
): Promise<MotionPermissionResult> {
  if (!hasRequestPermission(constructorValue)) {
    return "unsupported";
  }

  const result = await (
    constructorValue as {
      requestPermission: () => Promise<PermissionState>;
    }
  ).requestPermission();

  return result === "granted" ? "granted" : "denied";
}

function toMotionVector(
  vector: DeviceMotionEventAcceleration | null,
): MotionVector {
  return {
    x: toNullableNumber(vector?.x),
    y: toNullableNumber(vector?.y),
    z: toNullableNumber(vector?.z),
  };
}

function toRotationVector(
  vector: DeviceMotionEventRotationRate | null,
): RotationVector {
  return {
    alpha: toNullableNumber(vector?.alpha),
    beta: toNullableNumber(vector?.beta),
    gamma: toNullableNumber(vector?.gamma),
  };
}

function toNullableNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
