"use client";

import { Play, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

type DisplayItem = {
  label: string;
  value: string;
};

type FallbackAction = {
  label: string;
  onClick: () => void;
  tone?: "normal" | "caution" | "primary";
};

type TestStartPanelProps = {
  title: string;
  safetyInstruction: string;
  primaryLabel: string;
  onPrimary: () => void;
  statusItems: DisplayItem[];
  resultItems?: DisplayItem[];
  fallbackActions: FallbackAction[];
  children?: ReactNode;
};

export function TestStartPanel({
  title,
  safetyInstruction,
  primaryLabel,
  onPrimary,
  statusItems,
  resultItems = [],
  fallbackActions,
  children,
}: TestStartPanelProps) {
  return (
    <section className="grid gap-5">
      <div className="panel-card p-5 sm:p-6">
        <p className="eyebrow">Guided test</p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 flex max-w-3xl gap-2 text-[var(--muted)]">
          <ShieldCheck
            aria-hidden
            className="mt-1 shrink-0 text-[var(--primary)]"
            size={22}
          />
          <span>{safetyInstruction}</span>
        </p>
      </div>

      {children}

      <div className="flex justify-center rounded-lg border border-[var(--line)] bg-white px-4 py-6">
        <button
          className="flex h-44 w-44 flex-col items-center justify-center gap-3 rounded-full bg-[var(--primary)] p-5 text-center text-xl font-bold leading-tight text-white shadow-sm transition hover:bg-[var(--primary-dark)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-300"
          onClick={onPrimary}
          type="button"
        >
          <Play aria-hidden fill="currentColor" size={34} />
          {primaryLabel}
        </button>
      </div>

      <DisplayGrid items={statusItems} title="Status" />
      {resultItems.length > 0 && <DisplayGrid items={resultItems} title="Results" />}

      <div className="panel-card p-5">
        <p className="mb-3 text-base font-semibold text-[var(--muted)]">
          Other safe options
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {fallbackActions.map((action) => (
            <button
              className={
                action.tone === "primary" ? "primary-action" : "secondary-action"
              }
              key={action.label}
              onClick={action.onClick}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function DisplayGrid({
  items,
  title,
}: {
  items: DisplayItem[];
  title: string;
}) {
  return (
    <div>
      <h3 className="mb-3 text-xl font-semibold">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            className="quiet-card p-4"
            key={item.label}
          >
            <p className="text-base font-semibold text-[var(--muted)]">
              {item.label}
            </p>
            <p className="mt-1 text-2xl font-semibold leading-tight">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
