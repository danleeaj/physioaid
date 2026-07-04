"use client";

import type { ReactNode } from "react";

type DemoInstructionScreenProps = {
  title: string;
  description: string;
  animation: ReactNode;
  instructions: string[];
  safetyNote: string;
  primaryLabel?: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryProminent?: boolean;
  tertiaryLabel?: string;
  onTertiary?: () => void;
};

export function DemoInstructionScreen({
  title,
  description,
  animation,
  instructions,
  safetyNote,
  primaryLabel = "I understand, continue",
  onPrimary,
  secondaryLabel,
  onSecondary,
  secondaryProminent = false,
  tertiaryLabel,
  onTertiary,
}: DemoInstructionScreenProps) {
  return (
    <section className="grid gap-5">
      <div>
        <p className="text-base font-semibold text-[var(--primary-dark)]">
          Guided setup
        </p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-[var(--muted)]">{description}</p>
      </div>

      <div className="demo-visual flex min-h-[17rem] items-center justify-center rounded-lg border border-[var(--line)] bg-white p-4 sm:min-h-[21rem]">
        {animation}
      </div>

      <div className="grid gap-3">
        {instructions.map((instruction, index) => (
          <div
            className="flex min-h-16 items-center gap-3 rounded-md border border-[var(--line)] bg-white p-4"
            key={instruction}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#e8f5f2] text-base font-bold text-[var(--primary-dark)]">
              {index + 1}
            </span>
            <span className="font-semibold leading-snug">{instruction}</span>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-[#f1d6a8] bg-[#fff8ea] p-4 text-[var(--warning)]">
        <p className="font-semibold">{safetyNote}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button className="primary-action" onClick={onPrimary} type="button">
          {primaryLabel}
        </button>
        {secondaryLabel && onSecondary && (
          <button
            className={secondaryProminent ? "primary-action" : "secondary-action"}
            onClick={onSecondary}
            type="button"
          >
            {secondaryLabel}
          </button>
        )}
        {tertiaryLabel && onTertiary && (
          <button
            className="secondary-action text-base"
            onClick={onTertiary}
            type="button"
          >
            {tertiaryLabel}
          </button>
        )}
      </div>
    </section>
  );
}
