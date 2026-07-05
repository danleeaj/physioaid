"use client";

import { useEffect, useRef } from "react";

/** Accessible confirm dialog (save/exit from the guided flow). */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      aria-labelledby="confirm-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-5 sm:items-center"
      role="dialog"
    >
      <div className="app-card app-card--hero w-full max-w-sm bg-[var(--surface)]">
        <h2 className="text-[length:var(--text-lead)] font-bold" id="confirm-dialog-title">
          {title}
        </h2>
        <p className="mt-2 text-[var(--muted)]">{body}</p>
        <div className="mt-5 grid gap-3">
          <button
            className="secondary-action w-full"
            onClick={onCancel}
            ref={cancelRef}
            type="button"
          >
            {cancelLabel}
          </button>
          <button className="primary-action w-full" onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
