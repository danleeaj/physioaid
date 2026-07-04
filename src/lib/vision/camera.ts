export type CameraPermissionState =
  | "unknown"
  | "not_supported"
  | "prompt_required"
  | "granted"
  | "denied";

export type CameraSupportStatus = {
  supported: boolean;
  permissionState: CameraPermissionState;
  message: string;
};

export function getCameraSupportStatus(): CameraSupportStatus {
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices?.getUserMedia
  ) {
    return {
      supported: false,
      permissionState: "not_supported",
      message:
        "This browser does not expose camera capture. Manual and demo paths remain available.",
    };
  }

  return {
    supported: true,
    permissionState: "prompt_required",
    message:
      "Camera capture is available. Request permission only from a clear user action.",
  };
}

export async function requestCameraPreview(): Promise<{
  status: CameraSupportStatus;
  stream?: MediaStream;
}> {
  const current = getCameraSupportStatus();

  if (!current.supported) {
    return { status: current };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
      },
    });

    return {
      stream,
      status: {
        supported: true,
        permissionState: "granted",
        message:
          "Camera permission granted. Ezekiel can attach pose detection to this preview stream.",
      },
    };
  } catch {
    return {
      status: {
        supported: false,
        permissionState: "denied",
        message:
          "Camera permission was not granted. Continue with manual or demo floor-rising metrics.",
      },
    };
  }
}

export function stopCameraPreview(stream?: MediaStream) {
  stream?.getTracks().forEach((track) => track.stop());
}
