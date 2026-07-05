"use client";

import type { ReactNode } from "react";
import { ListenButton } from "@/components/i18n/ListenButton";

/**
 * One big left-aligned headline per screen, with an eyebrow, an optional
 * support line, and the read-aloud control.
 */
export function ScreenHeader({
  eyebrow,
  title,
  support,
  listenText,
  children,
}: {
  eyebrow?: string;
  title: string;
  support?: string;
  listenText?: string;
  children?: ReactNode;
}) {
  return (
    <header className="grid gap-3">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="text-[length:var(--text-title)] font-semibold sm:text-[length:var(--text-display)]">
        {title}
      </h1>
      {support && (
        <p className="max-w-2xl text-[length:var(--text-lead)] text-[var(--muted)]">
          {support}
        </p>
      )}
      <div className="flex items-center gap-3">
        <ListenButton text={listenText ?? [title, support].filter(Boolean).join(". ")} />
        {children}
      </div>
    </header>
  );
}
