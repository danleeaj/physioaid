"use client";

import { Play, ShieldCheck, Square } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SafetyCallout } from "@/components/assessment/ui/SafetyCallout";
import { ListenButton } from "@/components/i18n/ListenButton";
import { useLanguage } from "@/components/i18n/LanguageProvider";

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
  /**
   * Fires exactly once per run, when the run finishes (Stop pressed or the
   * countdown completes). Metric-injection semantics match the old
   * tap-to-complete behaviour.
   */
  onPrimary: () => void;
  statusItems: DisplayItem[];
  resultItems?: DisplayItem[];
  fallbackActions: FallbackAction[];
  /** Auto-complete the run after this many seconds (e.g. 30 for chair stand). */
  autoCompleteSeconds?: number;
  children?: ReactNode;
};

type RunState = "ready" | "running" | "done";

export function TestStartPanel({
  title,
  safetyInstruction,
  primaryLabel,
  onPrimary,
  statusItems,
  resultItems = [],
  fallbackActions,
  autoCompleteSeconds,
  children,
}: TestStartPanelProps) {
  const { t } = useLanguage();
  const [runState, setRunState] = useState<RunState>("ready");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const onPrimaryRef = useRef(onPrimary);

  useEffect(() => {
    onPrimaryRef.current = onPrimary;
  }, [onPrimary]);

  useEffect(() => {
    if (runState !== "running") {
      return;
    }
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setElapsedSeconds(elapsed);
      if (autoCompleteSeconds !== undefined && elapsed >= autoCompleteSeconds) {
        // Fires exactly once per run: the state change stops this interval.
        onPrimaryRef.current();
        setRunState("done");
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [runState, autoCompleteSeconds]);

  function startRun() {
    setElapsedSeconds(0);
    setRunState("running");
  }

  function stopRun() {
    onPrimary();
    setRunState("done");
  }

  return (
    <section className="grid gap-6">
      <header className="grid gap-3">
        <p className="eyebrow">{t("test.guidedTest")}</p>
        <h1 className="text-[length:var(--text-title)] font-semibold sm:text-[length:var(--text-display)]">
          {title}
        </h1>
        <p className="flex max-w-3xl gap-2 text-[length:var(--text-lead)] text-[var(--muted)]">
          <ShieldCheck
            aria-hidden
            className="mt-1 shrink-0 text-[var(--primary)]"
            size={22}
          />
          <span>{safetyInstruction}</span>
        </p>
        <div>
          <ListenButton text={`${title}. ${safetyInstruction}`} />
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {statusItems.map((item) => (
          <span className="status-pill status-pill--ready" key={item.label}>
            {item.label}: {item.value}
          </span>
        ))}
      </div>

      {children}

      {runState !== "running" && (
        <SafetyCallout>{t("test.safetyReminder")}</SafetyCallout>
      )}

      {runState === "running" ? (
        <div className="panel-card grid gap-6 p-6 text-center sm:p-8">
          <p className="text-[length:var(--text-label)] font-bold uppercase tracking-wide text-[var(--muted)]">
            {t("test.elapsed")}
          </p>
          <p aria-live="polite" className="text-7xl font-bold tabular-nums">
            {elapsedSeconds}
          </p>
          <p className="text-[length:var(--text-lead)] font-semibold text-[var(--danger)]">
            {t("test.safetyReminder")}
          </p>
          <button className="primary-action w-full" onClick={stopRun} type="button">
            <Square aria-hidden fill="currentColor" size={20} />
            {t("test.stopTest")}
          </button>
        </div>
      ) : (
        <div className="panel-card flex justify-center px-4 py-8">
          <button
            className="flex h-44 w-44 flex-col items-center justify-center gap-3 rounded-full border border-[var(--primary)] bg-[var(--primary)] p-5 text-center text-xl font-bold leading-tight text-white shadow-sm transition hover:bg-[var(--primary-dark)]"
            onClick={startRun}
            type="button"
          >
            <Play aria-hidden fill="currentColor" size={34} />
            {primaryLabel}
          </button>
        </div>
      )}

      {resultItems.length > 0 && runState !== "running" && (
        <div>
          <h2 className="mb-3 text-[length:var(--text-lead)] font-semibold">
            {t("test.results")}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {resultItems.map((item) => (
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
      )}

      {runState !== "running" && (
        <div className="quiet-card p-5">
          <p className="mb-3 text-[length:var(--text-label)] font-bold text-[var(--muted)]">
            {t("test.otherOptions")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {fallbackActions.map((action) => (
              <button
                className={
                  action.tone === "primary"
                    ? "primary-action"
                    : "secondary-action"
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
      )}
    </section>
  );
}
