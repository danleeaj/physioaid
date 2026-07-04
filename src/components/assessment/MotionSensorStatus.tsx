"use client";

import { Smartphone } from "lucide-react";
import { useState } from "react";
import {
  getMotionSupportStatus,
  requestMotionPermission,
} from "@/lib/sensors/browser-motion";
import type { MotionSupportStatus } from "@/types/motion";

export function MotionSensorStatus() {
  const [status, setStatus] = useState<MotionSupportStatus>(() =>
    getMotionSupportStatus(),
  );

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
          <p className="status-pill w-fit bg-[var(--blue-soft)] text-[var(--blue)]">
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
