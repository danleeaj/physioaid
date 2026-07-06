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
    const acceleration =
      event.accelerationIncludingGravity ?? event.acceleration;
    if (
      !acceleration ||
      acceleration.x === null ||
      acceleration.y === null ||
      acceleration.z === null
    ) {
      return;
    }

    onSample({
      timestampMs: performance.now(),
      accelerationX: acceleration.x,
      accelerationY: acceleration.y,
      accelerationZ: acceleration.z,
      rotationAlpha: event.rotationRate?.alpha ?? undefined,
      rotationBeta: event.rotationRate?.beta ?? undefined,
      rotationGamma: event.rotationRate?.gamma ?? undefined,
    });
  };

  window.addEventListener("devicemotion", handleMotion);
  return () => window.removeEventListener("devicemotion", handleMotion);
}
