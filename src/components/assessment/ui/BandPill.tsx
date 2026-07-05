"use client";

import { Activity, HeartPulse } from "lucide-react";

/**
 * Labeled ability/confidence band — the Apple-Health-screening pattern:
 * the band word is always shown (never colour-only), positioned on a
 * simple two/three-segment track.
 */
export function BandPill({
  label,
  bandLabel,
  positive,
  kind,
}: {
  label: string;
  bandLabel: string;
  positive: boolean;
  kind: "ability" | "confidence";
}) {
  const Icon = kind === "ability" ? Activity : HeartPulse;

  return (
    <div className="quiet-card grid gap-3 p-5">
      <p className="flex items-center gap-2 text-[length:var(--text-label)] font-bold text-[var(--muted-strong)]">
        <Icon aria-hidden className="text-[var(--primary)]" size={20} />
        {label}
      </p>
      <p
        className={`w-fit rounded-[var(--radius-pill)] px-4 py-1.5 text-[length:var(--text-lead)] font-bold ${
          positive
            ? "bg-[var(--success-soft)] text-[var(--success)]"
            : "bg-[var(--warning-soft)] text-[var(--warning)]"
        }`}
      >
        {bandLabel}
      </p>
    </div>
  );
}
