"use client";

import { Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  getMotionSupportStatus,
  requestMotionPermission,
  startMotionCapture,
} from "@/lib/sensors/browser-motion";
import type { MotionSample, MotionSupportStatus } from "@/types/motion";

// ponytail: SSR-safe placeholder — real check runs in useEffect to avoid hydration mismatch
const initialMotionStatus: MotionSupportStatus = {
  supported: false,
  permissionState: "unknown",
  requiresUserGesture: false,
  message: "Checking browser motion sensor support.",
};

export function MotionSensorStatus({
  onStatusChange,
}: {
  /** Reports the live permission state so parent screens can show it honestly. */
  onStatusChange?: (status: MotionSupportStatus) => void;
} = {}) {
  const [status, setStatus] =
    useState<MotionSupportStatus>(initialMotionStatus);
  const [listening, setListening] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);
  const [lastSample, setLastSample] = useState<MotionSample>();
  const stopCaptureRef = useRef<() => void>(() => {});

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setStatus(getMotionSupportStatus());
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    onStatusChange?.(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- notify on status change only
  }, [status]);

  useEffect(() => () => stopCaptureRef.current(), []);

  async function handleRequestPermission() {
    setStatus(await requestMotionPermission());
  }

  function toggleLiveTest() {
    if (listening) {
      stopCaptureRef.current();
      setListening(false);
      return;
    }

    setSampleCount(0);
    setLastSample(undefined);
    stopCaptureRef.current = startMotionCapture((sample) => {
      setSampleCount((count) => count + 1);
      setLastSample(sample);
    });
    setListening(true);
  }

  return (
    <div className="quiet-card p-4">
      <div className="flex gap-3">
        <Smartphone
          aria-hidden
          className="mt-1 shrink-0 text-[var(--primary)]"
          size={22}
        />
        <div className="grid gap-2">
          <p className="font-semibold">Motion sensor scaffold</p>
          <p className="text-base text-[var(--muted)]">{status.message}</p>
          <p className="status-pill status-pill--ready w-fit">
            Status: {status.permissionState.replaceAll("_", " ")}
          </p>
          {status.requiresUserGesture && status.permissionState !== "granted" && (
            <button
              className="secondary-action w-fit"
              onClick={handleRequestPermission}
              type="button"
            >
              Check motion permission
            </button>
          )}
          {status.supported && (
            <>
              <button
                className="secondary-action w-fit"
                onClick={toggleLiveTest}
                type="button"
              >
                {listening ? "Stop live sensor test" : "Test live motion sensor"}
              </button>
              {listening && (
                <div
                  aria-live="polite"
                  className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3 text-sm"
                >
                  <p>Samples received: {sampleCount}</p>
                  {lastSample ? (
                    <p className="tabular-nums">
                      x: {lastSample.accelerationX.toFixed(2)} · y:{" "}
                      {lastSample.accelerationY.toFixed(2)} · z:{" "}
                      {lastSample.accelerationZ.toFixed(2)}
                    </p>
                  ) : (
                    <p>
                      Waiting for the first sample — move the phone if
                      nothing appears within a couple seconds.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
