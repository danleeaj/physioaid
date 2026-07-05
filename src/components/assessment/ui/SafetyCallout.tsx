"use client";

import { AlertTriangle, OctagonAlert } from "lucide-react";
import type { ReactNode } from "react";

/** Inline safety notice — warning by default, danger for stop conditions. */
export function SafetyCallout({
  tone = "warning",
  children,
}: {
  tone?: "warning" | "danger";
  children: ReactNode;
}) {
  const Icon = tone === "danger" ? OctagonAlert : AlertTriangle;

  return (
    <div className={`callout ${tone === "danger" ? "callout--danger" : ""}`}>
      <div className="flex gap-3">
        <Icon
          aria-hidden
          className={`mt-0.5 shrink-0 ${
            tone === "danger" ? "text-[var(--danger)]" : "text-[var(--warning)]"
          }`}
          size={22}
        />
        <div className="text-[length:var(--text-body)]">{children}</div>
      </div>
    </div>
  );
}
