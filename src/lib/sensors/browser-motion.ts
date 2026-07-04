import type { MotionSupportStatus } from "@/types/motion";

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
