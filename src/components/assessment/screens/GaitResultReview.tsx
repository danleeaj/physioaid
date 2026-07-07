"use client";

import {
  gaitResultItems,
  gaitSourceLabel,
  speedSourceLabel,
} from "@/components/assessment/screens/gait-display";
import type { MotionMetrics } from "@/types/assessment";

export function GaitResultReview({
  motion,
  onBack,
}: {
  motion: MotionMetrics;
  onBack: () => void;
}) {
  const stopped = motion.completionStatus === "stopped";

  return (
    <section className="grid gap-4">
      <header className="grid gap-2">
        <h1 className="text-[length:var(--text-title)] font-semibold">
          Gait walk result
        </h1>
        <p className="text-[length:var(--text-body)] text-[var(--muted)]">
          {stopped
            ? "Stopped or unstable. Floor-rising is skipped."
            : "Review the gait walk measurements before returning."}
        </p>
      </header>
      <div className="flex flex-wrap gap-2">
        <span className="status-pill status-pill--ready">
          Source: {gaitSourceLabel(motion)}
        </span>
        <span className="status-pill status-pill--ready">
          Speed: {speedSourceLabel(motion)}
        </span>
      </div>
      <div className="quiet-card grid gap-2 p-4">
        <h2 className="text-[length:var(--text-label)] font-bold text-[var(--muted)]">
          Results
        </h2>
        <div className="grid gap-2">
          {gaitResultItems(motion).map((item) => (
            <div
              className="flex items-center justify-between gap-4 border-t border-[var(--border)] pt-2 first:border-t-0 first:pt-0"
              key={item.label}
            >
              <p className="text-[length:var(--text-caption)] font-semibold text-[var(--muted)]">
                {item.label}
              </p>
              <p className="text-right text-[length:var(--text-body)] font-bold leading-tight">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
      <button className="secondary-action w-full justify-center" onClick={onBack} type="button">
        Back to gait test
      </button>
    </section>
  );
}
