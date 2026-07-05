"use client";

import { Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getMotionSupportStatus,
  requestMotionPermission,
} from "@/lib/sensors/browser-motion";
import type { MotionSupportStatus } from "@/types/motion";

export function MotionSensorStatus({
  onStatusChange,
}: {
  /** Reports the live permission state so parent screens can show it honestly. */
  onStatusChange?: (status: MotionSupportStatus) => void;
} = {}) {
  const [status, setStatus] = useState<MotionSupportStatus>(() =>
    getMotionSupportStatus(),
  );

  useEffect(() => {
    onStatusChange?.(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- notify on status change only
  }, [status]);

  async function handleRequestPermission() {
    setStatus(await requestMotionPermission());
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
        </div>
      </div>
    </div>
  );
}
