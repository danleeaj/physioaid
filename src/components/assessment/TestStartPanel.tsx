"use client";

import { Play, ShieldCheck, Square } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SafetyCallout } from "@/components/assessment/ui/SafetyCallout";
import { ListenButton } from "@/components/i18n/ListenButton";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  requestMotionPermission,
  startMotionCapture,
} from "@/lib/sensors/browser-motion";
import { createStandstillAutoStopDetector } from "@/lib/sensors/standstill-auto-stop";
import { createStepCounter, type StepProgress } from "@/lib/sensors/step-detection";
import type { MotionSample } from "@/types/motion";

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
   * Optional start hook for live detectors. Return false to keep the panel
   * ready, for example when a browser permission request is denied.
   */
  onRunStart?: () => boolean | void | Promise<boolean | void>;
  /**
   * Fires exactly once per run, when the run finishes (Stop pressed or the
   * countdown completes). Metric-injection semantics match the old
   * tap-to-complete behaviour. Receives the real devicemotion samples
   * collected between Start and Stop (empty if motion capture isn't
   * supported on this device/browser) plus the run's elapsed duration,
   * plus optional calibration samples captured during the practice phase.
   */
  onPrimary: (
    samples: MotionSample[],
    elapsedSeconds: number,
    calibrationSamples?: MotionSample[],
  ) => void;
  statusItems: DisplayItem[];
  resultItems?: DisplayItem[];
  fallbackActions: FallbackAction[];
  /** Auto-complete the run after this many seconds (e.g. 30 for chair stand). */
  autoCompleteSeconds?: number;
  /** Show a live sample-count readout while running, proving the sensor is active. */
  showMotionReadout?: boolean;
  /**
   * Voice-guided pocket-mode sequence: request permission, then walk the
   * participant through "place phone in pocket" → baseline → countdown,
   * entirely by audio + vibration, since the screen isn't visible once the
   * phone is put away.
   */
  guidedPocketMode?: boolean;
  /** Word spoken at the end of the countdown, e.g. "begin" or "go". */
  countdownCueWord?: string;
  /**
   * Seconds for a calibration phase (2–3 practice reps) inserted between
   * baseline and countdown. The captured samples are passed as the third
   * arg to onPrimary so the caller can derive personalized thresholds.
   */
  calibrationSeconds?: number;
  /**
   * When set, the active phase auto-completes once step-based distance
   * (accelerometer peak detection × estimated step length) reaches
   * targetMeters — no GPS involved. Lets a distance-based test auto-stop
   * even though the phone can't be seen once it's in a pocket.
   */
  autoStopDistance?: { targetMeters: number; stepLengthMeters: number };
  /**
   * Optional active-phase auto-finish for one-phone tests where the user
   * cannot press Stop at the finish line. The detector waits until walking
   * has started, then finishes after the required stillness window.
   */
  autoStopOnStandstill?: { stillSeconds: number; completionCue?: string };
  /** Spoken cue during the guided baseline stage. */
  guidedBaselineCue?: string;
  /** Spoken cue immediately when the active phase starts. */
  guidedActiveCue?: string;
  /** Start immediately after this panel mounts, used after a separate instruction screen. */
  autoStartOnMount?: boolean;
  /** Reduce spacing for one-page test surfaces. */
  compactLayout?: boolean;
  /** Hide the intro header when an instruction screen has already shown it. */
  showHeader?: boolean;
  /** Hide fallback actions during focused live test runs. */
  showFallbackActions?: boolean;
  /** Hide inline result tiles when a dedicated result screen follows. */
  showResultItems?: boolean;
  /** Hide the pre-run safety reminder when a separate instruction screen covers it. */
  showSafetyReminder?: boolean;
  children?: ReactNode;
};

type RunState = "ready" | "running" | "done";
type GuidedStage =
  | "priming"
  | "pocket"
  | "baseline"
  | "calibrate"
  | "countdown"
  | "active";

const POCKET_PLACEMENT_MS = 4000;
const BASELINE_MS = 3000;
const COUNTDOWN_MS = 3000;

const GUIDED_STAGE_COPY: Record<
  Exclude<GuidedStage, "active">,
  { headline: string; detail: string }
> = {
  priming: {
    headline: "Requesting motion access…",
    detail: "Allow motion access if your browser asks.",
  },
  pocket: {
    headline: "Place phone in pocket",
    detail: "You have a few seconds to put the phone in a front pocket.",
  },
  baseline: {
    headline: "Stand still",
    detail: "Recording a resting baseline before the test begins.",
  },
  calibrate: {
    headline: "Practice reps",
    detail:
      "Do 2–3 practice sit-to-stands now. This calibrates the sensor to your movement.",
  },
  countdown: {
    headline: "Get ready…",
    detail: "3, 2, 1 — the test starts automatically.",
  },
};

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

export function TestStartPanel({
  title,
  safetyInstruction,
  primaryLabel,
  onRunStart,
  onPrimary,
  statusItems,
  resultItems = [],
  fallbackActions,
  autoCompleteSeconds,
  showMotionReadout = false,
  guidedPocketMode = false,
  countdownCueWord = "begin",
  calibrationSeconds,
  autoStopDistance,
  autoStopOnStandstill,
  guidedBaselineCue,
  guidedActiveCue,
  autoStartOnMount = false,
  compactLayout = false,
  showHeader = true,
  showFallbackActions = true,
  showResultItems = true,
  showSafetyReminder = true,
  children,
}: TestStartPanelProps) {
  const { t, speak, stopSpeaking } = useLanguage();
  const [runState, setRunState] = useState<RunState>("ready");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [motionSampleCount, setMotionSampleCount] = useState(0);
  const [guidedStage, setGuidedStage] = useState<GuidedStage | null>(null);
  const [guidedError, setGuidedError] = useState<string>();
  const [stepProgress, setStepProgress] = useState<StepProgress>();
  const onPrimaryRef = useRef(onPrimary);
  const samplesRef = useRef<MotionSample[]>([]);
  const activeStartIndexRef = useRef(0);
  const activeStartedAtRef = useRef(0);
  const stopCaptureRef = useRef<() => void>(() => {});
  const stepCounterRef = useRef<ReturnType<typeof createStepCounter> | null>(
    null,
  );
  const standstillAutoStopRef = useRef<ReturnType<
    typeof createStandstillAutoStopDetector
  > | null>(null);
  const calibrationStartRef = useRef(0);
  const calibrationEndRef = useRef(0);
  const cancelledRef = useRef(false);
  const finishedRef = useRef(false);
  const autoStartedRef = useRef(false);
  const finishRunRef = useRef<(elapsed: number) => void>(() => {});

  useEffect(() => {
    onPrimaryRef.current = onPrimary;
  }, [onPrimary]);

  // Stop any in-flight sensor capture if the panel unmounts mid-run.
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      stopCaptureRef.current();
    };
  }, []);

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
        finishRunRef.current(elapsed);
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [runState, autoCompleteSeconds]);

  function beginCapture() {
    samplesRef.current = [];
    activeStartIndexRef.current = 0;
    finishedRef.current = false;
    setMotionSampleCount(0);
    setStepProgress(undefined);
    stopCaptureRef.current = startMotionCapture((sample) => {
      samplesRef.current.push(sample);
      setMotionSampleCount(samplesRef.current.length);
      stepCounterRef.current?.addSample(sample);
      standstillAutoStopRef.current?.addSample(sample);
    });
  }

  function beginActivePhase() {
    setElapsedSeconds(0);
    activeStartedAtRef.current = Date.now();
    setGuidedStage("active");
    setRunState("running");

    if (autoStopOnStandstill) {
      standstillAutoStopRef.current = createStandstillAutoStopDetector({
        requiredStillMs: autoStopOnStandstill.stillSeconds * 1000,
        onStandstill: () => {
          const elapsed = Math.max(
            1,
            Math.ceil((Date.now() - activeStartedAtRef.current) / 1000),
          );
          finishRunRef.current(elapsed);
        },
      });
    } else {
      standstillAutoStopRef.current = null;
    }

    if (autoStopDistance) {
      stepCounterRef.current = createStepCounter({
        stepLengthMeters: autoStopDistance.stepLengthMeters,
        onStep: (progress) => {
          setStepProgress(progress);
          if (
            !finishedRef.current &&
            progress.distanceMeters >= autoStopDistance.targetMeters
          ) {
            const elapsed = Math.floor(
              (Date.now() - activeStartedAtRef.current) / 1000,
            );
            finishRunRef.current(elapsed);
          }
        },
      });
    } else {
      stepCounterRef.current = null;
    }

    if (guidedPocketMode && guidedActiveCue) {
      speak(guidedActiveCue);
    }
  }

  function finishRun(elapsed: number) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    standstillAutoStopRef.current = null;
    stopCaptureRef.current();
    setGuidedStage(null);
    if (guidedPocketMode) {
      speak(autoStopOnStandstill?.completionCue ?? "Test complete.");
      vibrate([120, 80, 120]);
    }
    const calibrationSamples =
      calibrationStartRef.current < calibrationEndRef.current
        ? samplesRef.current.slice(
            calibrationStartRef.current,
            calibrationEndRef.current,
          )
        : undefined;
    onPrimaryRef.current(
      samplesRef.current.slice(activeStartIndexRef.current),
      elapsed,
      calibrationSamples,
    );
    setRunState("done");
  }

  useEffect(() => {
    finishRunRef.current = finishRun;
  });

  useEffect(() => {
    if (!autoStartOnMount) return;
    if (runState !== "ready") return;
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;
    void startRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-start is a mount transition after the separate TEST screen
  }, [autoStartOnMount]);

  async function startRun() {
    const runStartResult = await onRunStart?.();
    if (runStartResult === false) {
      return;
    }

    if (!guidedPocketMode) {
      beginCapture();
      beginActivePhase();
      return;
    }

    cancelledRef.current = false;
    setGuidedError(undefined);
    setGuidedStage("priming");

    const status = await requestMotionPermission();
    if (cancelledRef.current) return;

    if (status.permissionState === "denied") {
      setGuidedError(status.message);
      setGuidedStage(null);
      return;
    }

    speak("Motion access granted.");
    vibrate(120);
    await wait(1200);
    if (cancelledRef.current) return;

    setGuidedStage("pocket");
    speak("Place phone in pocket.");
    vibrate(120);
    await wait(POCKET_PLACEMENT_MS);
    if (cancelledRef.current) return;

    setGuidedStage("baseline");
    speak(guidedBaselineCue ?? "Stand still.");
    beginCapture();
    await wait(BASELINE_MS);
    if (cancelledRef.current) return;

    if (calibrationSeconds) {
      calibrationStartRef.current = samplesRef.current.length;
      setGuidedStage("calibrate");
      speak("Do 2 practice sit to stands now.");
      vibrate([120, 80, 120]);
      await wait(calibrationSeconds * 1000);
      if (cancelledRef.current) return;
      calibrationEndRef.current = samplesRef.current.length;
      speak("Good. Stand still.");
      vibrate(120);
      await wait(2000);
      if (cancelledRef.current) return;
    }

    setGuidedStage("countdown");
    speak(`3, 2, 1, ${countdownCueWord}.`);
    await wait(COUNTDOWN_MS);
    if (cancelledRef.current) return;

    activeStartIndexRef.current = samplesRef.current.length;
    beginActivePhase();
  }

  function cancelGuidedSequence() {
    cancelledRef.current = true;
    stopSpeaking();
    standstillAutoStopRef.current = null;
    stopCaptureRef.current();
    setGuidedStage(null);
  }

  function stopRun() {
    finishRun(elapsedSeconds);
  }

  const inGuidedPrelude = guidedStage !== null && guidedStage !== "active";

  return (
    <section className={compactLayout ? "grid gap-4" : "grid gap-6"}>
      {showHeader && (
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
      )}

      <div className="flex flex-wrap gap-2">
        {statusItems.map((item) => (
          <span className="status-pill status-pill--ready" key={item.label}>
            {item.label}: {item.value}
          </span>
        ))}
      </div>

      {children}

      {guidedError && (
        <SafetyCallout tone="danger">
          {guidedError} You can still use manual entry or mark the test
          unsafe below.
        </SafetyCallout>
      )}

      {showSafetyReminder && !inGuidedPrelude && runState !== "running" && (
        <SafetyCallout>{t("test.safetyReminder")}</SafetyCallout>
      )}

      {inGuidedPrelude && guidedStage !== null ? (
        <div
          className={`panel-card grid text-center ${
            compactLayout ? "gap-4 p-5" : "gap-6 p-6 sm:p-8"
          }`}
        >
          <p className="text-[length:var(--text-label)] font-bold uppercase tracking-wide text-[var(--muted)]">
            {GUIDED_STAGE_COPY[guidedStage].headline}
          </p>
          <p aria-live="polite" className="text-[length:var(--text-lead)]">
            {GUIDED_STAGE_COPY[guidedStage].detail}
          </p>
          <button
            className="secondary-action w-full"
            onClick={cancelGuidedSequence}
            type="button"
          >
            Cancel test
          </button>
        </div>
      ) : runState === "running" ? (
        <div
          className={`panel-card grid text-center ${
            compactLayout ? "gap-4 p-5" : "gap-6 p-6 sm:p-8"
          }`}
        >
          <p className="text-[length:var(--text-label)] font-bold uppercase tracking-wide text-[var(--muted)]">
            {t("test.elapsed")}
          </p>
          <p aria-live="polite" className="text-7xl font-bold tabular-nums">
            {elapsedSeconds}
          </p>
          {showMotionReadout && (
            <p aria-live="polite" className="text-sm text-[var(--muted)]">
              Motion samples captured: {motionSampleCount}
            </p>
          )}
          {autoStopDistance && (
            <p aria-live="polite" className="text-sm text-[var(--muted)]">
              Distance: {(stepProgress?.distanceMeters ?? 0).toFixed(1)}m /{" "}
              {autoStopDistance.targetMeters}m ({stepProgress?.stepCount ?? 0}{" "}
              steps)
            </p>
          )}
          {autoStopOnStandstill && (
            <p aria-live="polite" className="text-sm text-[var(--muted)]">
              Finishes after {autoStopOnStandstill.stillSeconds}s standing
              still
            </p>
          )}
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

      {showResultItems && resultItems.length > 0 && runState !== "running" && (
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

      {showFallbackActions && !inGuidedPrelude && runState !== "running" && (
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
