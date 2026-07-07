import type { MotionSample, MotionSupportStatus } from "@/types/motion";

type DeviceMotionEventWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export function getMotionSupportStatus(): MotionSupportStatus {
  if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) {
    return {
      supported: false,
      permissionState: "not_supported",
      requiresUserGesture: false,
      message:
        "This browser does not expose motion sensors. Manual and demo paths remain available.",
    };
  }

  const deviceMotion =
    DeviceMotionEvent as DeviceMotionEventWithPermission;
  const requiresUserGesture =
    typeof deviceMotion.requestPermission === "function";

  return {
    supported: true,
    permissionState: requiresUserGesture ? "prompt_required" : "granted",
    requiresUserGesture,
    message: requiresUserGesture
      ? "Motion permission must be requested from a user tap on iPhone Safari."
      : "Motion sensors appear available without an extra browser permission prompt.",
  };
}

export async function requestMotionPermission(): Promise<MotionSupportStatus> {
  const current = getMotionSupportStatus();

  if (!current.supported || !current.requiresUserGesture) {
    return current;
  }

  const deviceMotion =
    DeviceMotionEvent as DeviceMotionEventWithPermission;
  const result = await deviceMotion.requestPermission?.();

  return {
    supported: result === "granted",
    permissionState: result === "granted" ? "granted" : "denied",
    requiresUserGesture: true,
    message:
      result === "granted"
        ? "Motion permission granted. Daniel can start collecting samples from this point."
        : "Motion permission was not granted. Keep using manual or demo metrics.",
  };
}

// ponytail: defensive helpers from stash — guards against NaN/Infinity on noisy hardware reads
function toFiniteNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toFiniteVector(vector: DeviceMotionEventAcceleration | null) {
  const x = toFiniteNumber(vector?.x);
  const y = toFiniteNumber(vector?.y);
  const z = toFiniteNumber(vector?.z);

  if (x === null && y === null && z === null) {
    return null;
  }

  return { x: x ?? 0, y: y ?? 0, z: z ?? 0 };
}

/**
 * Converts a browser DeviceMotion event into the gait sample shape.
 * Gait reconstruction requires acceleration including gravity, so missing
 * `accelerationIncludingGravity` is treated as no usable sample.
 */
export function motionSampleFromDeviceMotionEvent(
  event: DeviceMotionEvent,
  timestampMs: number,
): MotionSample | null {
  const acceleration = toFiniteVector(event.accelerationIncludingGravity);

  if (!acceleration) {
    return null;
  }

  return {
    timestampMs,
    accelerationX: acceleration.x,
    accelerationY: acceleration.y,
    accelerationZ: acceleration.z,
    rotationAlpha: toFiniteNumber(event.rotationRate?.alpha) ?? undefined,
    rotationBeta: toFiniteNumber(event.rotationRate?.beta) ?? undefined,
    rotationGamma: toFiniteNumber(event.rotationRate?.gamma) ?? undefined,
  };
}

/**
 * Subscribes to real `devicemotion` events and reports each sample.
 * Returns an unsubscribe function. No-op (never calls back) if the
 * browser doesn't expose the event.
 */
export function startMotionCapture(
  onSample: (sample: MotionSample) => void,
): () => void {
  if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) {
    return () => {};
  }

  const handleMotion = (event: DeviceMotionEvent) => {
    const sample = motionSampleFromDeviceMotionEvent(event, performance.now());

    if (!sample) {
      return;
    }

    onSample(sample);
  };

  window.addEventListener("devicemotion", handleMotion);
  return () => window.removeEventListener("devicemotion", handleMotion);
}
