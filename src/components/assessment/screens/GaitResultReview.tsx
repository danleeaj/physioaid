"use client";

import {
  gaitResultItems,
  gaitSourceLabel,
  speedSourceLabel,
} from "@/components/assessment/screens/gait-display";
import { SafetyCallout } from "@/components/assessment/ui/SafetyCallout";
import { ScreenHeader } from "@/components/assessment/ui/ScreenHeader";
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
    <section className="grid gap-6">
      <ScreenHeader
        support={
          stopped
            ? "Gait walking was stopped or marked unstable. Higher-risk testing is skipped in this flow."
            : "Review the gait walk measurements before returning to the test screen."
        }
        title="Gait walk result"
      />
      <div className="flex flex-wrap gap-2">
        <span className="status-pill status-pill--ready">
          Source: {gaitSourceLabel(motion)}
        </span>
        <span className="status-pill status-pill--ready">
          Speed: {speedSourceLabel(motion)}
        </span>
      </div>
      {stopped && (
        <SafetyCallout tone="danger">
          Gait walking suggests caution. The floor-rising test is the
          highest-risk test and should not be attempted in this flow.
        </SafetyCallout>
      )}
      <div>
        <h2 className="mb-3 text-[length:var(--text-lead)] font-semibold">
          Results
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gaitResultItems(motion).map((item) => (
            <div className="stat-tile" key={item.label}>
              <p className="text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
                {item.label}
              </p>
              <p className="mt-1 text-xl font-bold leading-tight">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button className="secondary-action" onClick={onBack} type="button">
          Back to gait test
        </button>
      </div>
    </section>
  );
}
