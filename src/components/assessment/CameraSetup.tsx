"use client";

import { Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  type CameraSupportStatus,
  getCameraSupportStatus,
  requestCameraPreview,
  stopCameraPreview,
} from "@/lib/vision/camera";

export function CameraSetup() {
  const [status, setStatus] = useState<CameraSupportStatus>(() =>
    getCameraSupportStatus(),
  );
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | undefined>(undefined);

  useEffect(() => {
    return () => stopCameraPreview(streamRef.current);
  }, []);

  async function handleStartPreview() {
    const result = await requestCameraPreview();
    setStatus(result.status);
    streamRef.current = result.stream;

    if (result.stream && videoRef.current) {
      videoRef.current.srcObject = result.stream;
      setPreviewEnabled(true);
    }
  }

  return (
    <div className="quiet-card p-4">
      <div className="flex gap-3">
        <Camera
          aria-hidden
          className="mt-1 shrink-0 text-[var(--primary)]"
          size={22}
        />
        <div className="grid flex-1 gap-3">
          <div>
            <p className="font-semibold">Camera vision scaffold</p>
            <p className="text-base text-[var(--muted)]">{status.message}</p>
            <p className="status-pill mt-3 w-fit bg-[var(--blue-soft)] text-[var(--blue)]">
              Status: {status.permissionState.replaceAll("_", " ")}
            </p>
          </div>
          <video
            autoPlay
            className={`aspect-video w-full rounded-md bg-black object-cover ${
              previewEnabled ? "block" : "hidden"
            }`}
            muted
            playsInline
            ref={videoRef}
          />
          {status.permissionState !== "granted" && (
            <button
              className="secondary-action w-fit"
              onClick={handleStartPreview}
              type="button"
            >
              Check camera permission
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
