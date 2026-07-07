"use client";

import { CheckCircle2, Play, ShieldAlert, TimerReset } from "lucide-react";
import type { MotionSupportStatus } from "@/types/motion";

function motionReady(status: MotionSupportStatus | undefined) {
  return status?.permissionState === "granted";
}

export function GaitCompactReadyPanel({
  canUseCalibration,
  motionStatus,
  onCalibrate,
  onEnableMotion,
  onManualEntry,
  onMarkStopped,
  onStart,
}: {
  canUseCalibration: boolean;
  motionStatus: MotionSupportStatus | undefined;
  onCalibrate: () => void;
  onEnableMotion: () => void;
  onManualEntry: () => void;
  onMarkStopped: () => void;
  onStart: () => void;
}) {
  const ready = motionReady(motionStatus);

  return (
    <section className="grid gap-4">
      <header className="grid gap-2">
        <p className="eyebrow">Motion gait walk</p>
        <h1 className="text-[length:var(--text-title)] font-semibold">
          Gait walk test
        </h1>
        <p className="text-[length:var(--text-body)] text-[var(--muted)]">
          Use a front pocket. Walk at a usual safe pace.
        </p>
      </header>

      <div className="quiet-card grid gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {ready ? (
              <CheckCircle2
                aria-hidden
                className="shrink-0 text-[var(--success)]"
                size={22}
              />
            ) : (
              <ShieldAlert
                aria-hidden
                className="shrink-0 text-[var(--warning)]"
                size={22}
              />
            )}
            <div className="min-w-0">
              <p className="font-semibold">
                {ready ? "Motion ready" : "Motion pending"}
              </p>
              <p className="truncate text-[length:var(--text-caption)] text-[var(--muted)]">
                {motionStatus?.message ?? "Checking motion permission."}
              </p>
            </div>
          </div>
          {!ready && (
            <button
              className="secondary-action shrink-0"
              onClick={onEnableMotion}
              type="button"
            >
              Enable motion
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            className="secondary-action"
            disabled={!canUseCalibration}
            onClick={onCalibrate}
            type="button"
          >
            <TimerReset aria-hidden size={18} />
            Calibrate
          </button>
          <button className="secondary-action" onClick={onManualEntry} type="button">
            Enter manually
          </button>
        </div>
      </div>

      <button
        className="primary-action min-h-28 w-full justify-center text-xl"
        onClick={onStart}
        type="button"
      >
        <Play aria-hidden fill="currentColor" size={28} />
        Start 15 sec walk
      </button>

      <button
        className="secondary-action w-full justify-center"
        onClick={onMarkStopped}
        type="button"
      >
        Mark stopped or unstable
      </button>
    </section>
  );
}

export function GaitTestInstructionPanel({
  durationSeconds,
  onBack,
  onStart,
}: {
  durationSeconds: number;
  onBack: () => void;
  onStart: () => void;
}) {
  return (
    <section className="grid gap-4">
      <header className="grid gap-2">
        <p className="eyebrow">Guided walk</p>
        <h1 className="text-[length:var(--text-title)] font-semibold">TEST</h1>
        <p className="text-[length:var(--text-body)] text-[var(--muted)]">
          Follow the voice prompts. The phone can stay in a front pocket.
        </p>
      </header>

      <div className="quiet-card grid gap-3 p-4">
        <p className="font-semibold">
          Walk for {durationSeconds} seconds at your usual safe pace.
        </p>
        <ul className="grid gap-2 text-[length:var(--text-body)] text-[var(--muted)]">
          <li>Stand still first until the voice says go.</li>
          <li>Stop early if you feel unsteady or need help.</li>
          <li>When the timer finishes, return to the phone for results.</li>
        </ul>
      </div>

      <button
        className="primary-action min-h-20 w-full justify-center text-xl"
        onClick={onStart}
        type="button"
      >
        <Play aria-hidden fill="currentColor" size={26} />
        Start
      </button>
      <button
        className="secondary-action w-full justify-center"
        onClick={onBack}
        type="button"
      >
        Back
      </button>
    </section>
  );
}
