"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

/** Large tappable single-select row (≥56px target). */
export function ChoiceOption({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-checked={selected}
      className="choice-option text-left"
      data-selected={selected}
      onClick={onSelect}
      role="radio"
      type="button"
    >
      <span
        aria-hidden
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
          selected
            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
            : "border-[var(--line)] bg-white text-transparent"
        }`}
      >
        <Check size={16} strokeWidth={3} />
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}
