"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

/** Sticky secondary-screen header: back arrow, title, optional right slot. */
export function TopBar({
  title,
  onBack,
  backLabel = "Back",
  right,
}: {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  right?: ReactNode;
}) {
  return (
    <header className="top-bar">
      {onBack && (
        <button
          aria-label={backLabel}
          className="icon-button -ml-2"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft aria-hidden size={24} />
        </button>
      )}
      <h1 className="top-bar__title min-w-0 flex-1 truncate">{title}</h1>
      {right}
    </header>
  );
}
