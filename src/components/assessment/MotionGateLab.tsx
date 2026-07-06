"use client";

import {
  Activity,
  CheckCircle2,
  Gauge,
  Play,
  SlidersHorizontal,
  Square,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MotionSensorStatus } from "@/components/assessment/MotionSensorStatus";
import {
  requestMotionPermission,
  startMotionCapture,
} from "@/lib/sensors/browser-motion";
import type { MotionSample } from "@/types/motion";
import {
  getDemoMotionMetrics,
  getUnavailableMotionMetrics,
  summarizeMotionSamples,
} from "@/lib/sensors/motion-summary";
import { getMotionGate } from "@/lib/functional-tests/gates";
import type { MotionMetrics } from "@/types/assessment";

type CompletionStatus = NonNullable<MotionMetrics["completionStatus"]>;
type MotionSource = MotionMetrics["source"];
type CaptureState = "idle" | "running";
type PresetMetric = {
  label: string;
  icon: typeof CheckCircle2;
  metrics: MotionMetrics;
};

const initialMotionMetrics = getUnavailableMotionMetrics("accelerometer");

const presetMetrics: PresetMetric[] = [
  {
    label: "Passing gait",
    icon: CheckCircle2,
    metrics: {
      stabilityScore: 0.72,
      rhythmConsistency: 0.68,
      gaitSpeedMetersPerSecond: 0.92,
      completionStatus: "completed",
      source: "manual",
    },
  },
  {
    label: "Low rhythm",
    icon: Activity,
    metrics: {
      stabilityScore: 0.72,
      rhythmConsistency: 0.42,
      gaitSpeedMetersPerSecond: 0.86,
      completionStatus: "completed",
      source: "manual",
    },
  },
  {
    label: "Low stability",
    icon: Gauge,
    metrics: {
      stabilityScore: 0.35,
      rhythmConsistency: 0.64,
      gaitSpeedMetersPerSecond: 0.8,
      completionStatus: "completed",
      source: "manual",
    },
  },
  {
    label: "Stopped",
    icon: XCircle,
    metrics: getUnavailableMotionMetrics("manual"),
  },
  {
    label: "Demo gait",
    icon: SlidersHorizontal,
    metrics: getDemoMotionMetrics(),
  },
  {
    label: "No samples",
    icon: Square,
    metrics: getUnavailableMotionMetrics("accelerometer"),
  },
];

const completionOptions: CompletionStatus[] = ["completed", "stopped", "demo"];
const sourceOptions: MotionSource[] = ["manual", "accelerometer", "demo"];

export function MotionGateLab() {
  const [motion, setMotion] = useState<MotionMetrics>(initialMotionMetrics);
  const [inputMode, setInputMode] = useState(
    "No live capture. Gate starts blocked.",
  );
  const [distanceMeters, setDistanceMeters] = useState(4);
  const [sampleCount, setSampleCount] = useState(0);
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [captureMessage, setCaptureMessage] = useState(
    "No sensor samples have been captured on this device yet.",
  );
  const samplesRef = useRef<MotionSample[]>([]);
  const stopCaptureRef = useRef<() => void>(() => {});
  const startedAtRef = useRef<number | null>(null);

  const gate = useMemo(() => getMotionGate(motion), [motion]);
  const gateTone = gate.canProceed ? "ready" : "danger";
  const GateIcon = gate.canProceed ? CheckCircle2 : XCircle;

  useEffect(() => {
    return () => {
      stopCaptureRef.current();
    };
  }, []);

  function applyPreset(preset: PresetMetric) {
    stopCaptureRef.current();
    startedAtRef.current = null;
    setCaptureState("idle");
    setSampleCount(0);
    samplesRef.current = [];
    setMotion(preset.metrics);
    setInputMode(`Simulated preset: ${preset.label}`);
    setCaptureMessage(
      "Preset applied. These are synthetic gate-test values, not laptop sensor data.",
    );
  }

  function updateMotion(patch: Partial<MotionMetrics>) {
    setMotion((current) => ({
      ...current,
      ...patch,
    }));
    setInputMode("Manually edited values");
    setCaptureMessage(
      "Manual values edited. These are test inputs, not live sensor samples.",
    );
  }

  async function startLiveCapture() {
    if (captureState === "running") {
      return;
    }

    let status;
    try {
      status = await requestMotionPermission();
    } catch {
      setMotion(getUnavailableMotionMetrics("accelerometer"));
      setInputMode("No live capture. Permission check failed.");
      setCaptureMessage("Motion permission could not be checked.");
      return;
    }

    if (!status.supported || status.permissionState !== "granted") {
      setMotion(getUnavailableMotionMetrics("accelerometer"));
      setInputMode("No live capture. Browser motion unavailable.");
      setCaptureMessage("Motion sensing is not available for this browser run.");
      return;
    }

    stopCaptureRef.current();
    samplesRef.current = [];
    setSampleCount(0);
    startedAtRef.current = nowMs();
    stopCaptureRef.current = startMotionCapture((sample) => {
      samplesRef.current.push(sample);
      setSampleCount(samplesRef.current.length);
    });
    setCaptureState("running");
    setInputMode("Capturing live accelerometer samples");
    setCaptureMessage("Capturing accelerometer samples.");
  }

  function stopLiveCapture() {
    const startedAt = startedAtRef.current;
    const durationSeconds =
      startedAt === null ? 0 : Math.max((nowMs() - startedAt) / 1000, 0);
    stopCaptureRef.current();
    const samples = [...samplesRef.current];
    const metrics = summarizeMotionSamples({
      samples,
      distanceMeters,
      durationSeconds,
    });

    startedAtRef.current = null;
    setCaptureState("idle");
    setSampleCount(samples.length);
    setMotion(metrics);
    setInputMode("Live accelerometer summary");
    setCaptureMessage(
      metrics.completionStatus === "stopped"
        ? `Captured ${samples.length} samples over ${durationSeconds.toFixed(1)}s. Sample quality did not pass the gait summary checks.`
        : `Captured ${samples.length} samples over ${durationSeconds.toFixed(1)}s.`,
    );
  }

  return (
    <div className="grid gap-5">
      <header className="grid gap-3">
        <p className="eyebrow">Motion gate lab</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-2">
            <h1 className="text-[length:var(--text-title)] font-semibold sm:text-[length:var(--text-display)]">
              Gait gate test bench
            </h1>
            <p className="max-w-3xl text-[length:var(--text-lead)] text-[var(--muted)]">
              Directly exercise the motion gait gate without entering the full
              assessment flow. The page starts with no captured samples; presets
              are simulated fixtures.
            </p>
          </div>
          <div
            className={`status-pill w-fit border-transparent ${
              gateTone === "ready"
                ? "status-pill--ready"
                : "bg-[var(--danger-soft)] text-[var(--danger)]"
            }`}
          >
            <GateIcon aria-hidden size={18} />
            {gate.canProceed ? "Gate passes" : "Gate blocks"}
          </div>
        </div>
      </header>

      <MotionSensorStatus />

      <div className="callout">
        <div className="grid gap-1">
          <p className="font-bold">Current input mode: {inputMode}</p>
          <p>
            A passing gate on this page only means the current test inputs pass.
            It is not a live laptop gait result unless you used live capture and
            captured usable samples.
          </p>
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="panel-card grid gap-5 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Inputs</h2>
              <p className="text-[length:var(--text-label)] text-[var(--muted)]">
                These values feed the same gate used by the assessment flow.
                Presets below are synthetic examples.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {presetMetrics.map((preset) => {
              const PresetIcon = preset.icon;
              return (
                <button
                  className="secondary-action justify-start text-left text-[length:var(--text-body)]"
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  type="button"
                >
                  <PresetIcon aria-hidden size={20} />
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-4">
            <RangeField
              label="Stability score"
              max={1}
              min={0}
              onChange={(value) => updateMotion({ stabilityScore: value })}
              value={motion.stabilityScore}
            />
            <RangeField
              label="Rhythm consistency"
              max={1}
              min={0}
              onChange={(value) => updateMotion({ rhythmConsistency: value })}
              value={motion.rhythmConsistency}
            />
            <RangeField
              label="Gait speed"
              max={2}
              min={0}
              onChange={(value) =>
                updateMotion({ gaitSpeedMetersPerSecond: value })
              }
              suffix="m/s"
              value={motion.gaitSpeedMetersPerSecond ?? 0}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Completion status"
              onChange={(value) =>
                updateMotion({ completionStatus: value as CompletionStatus })
              }
              options={completionOptions}
              value={motion.completionStatus ?? "completed"}
            />
            <SelectField
              label="Source"
              onChange={(value) => updateMotion({ source: value as MotionSource })}
              options={sourceOptions}
              value={motion.source}
            />
          </div>
        </div>

        <aside className="panel-card grid content-start gap-5 p-5">
          <div className="grid gap-2">
            <h2 className="text-xl font-bold">Gate output</h2>
            <p className="text-[length:var(--text-label)] text-[var(--muted)]">
              {gate.reason}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricTile
              label="Can proceed"
              value={gate.canProceed ? "Yes" : "No"}
            />
            <MetricTile label="Input mode" value={inputMode} />
            <MetricTile
              label="Status"
              value={motion.completionStatus ?? "completed"}
            />
            <MetricTile
              label="Stability"
              value={`${Math.round(motion.stabilityScore * 100)}%`}
            />
            <MetricTile
              label="Rhythm"
              value={`${Math.round(motion.rhythmConsistency * 100)}%`}
            />
            <MetricTile
              label="Speed"
              value={`${(motion.gaitSpeedMetersPerSecond ?? 0).toFixed(2)} m/s`}
            />
            <MetricTile label="Source" value={motion.source} />
          </div>

          <div
            className={`callout ${
              gate.canProceed ? "" : "callout--danger"
            }`}
          >
            <div className="flex gap-3">
              <GateIcon
                aria-hidden
                className={
                  gate.canProceed
                    ? "mt-0.5 shrink-0 text-[var(--success)]"
                    : "mt-0.5 shrink-0 text-[var(--danger)]"
                }
                size={22}
              />
              <p className="text-[length:var(--text-body)]">
                {gate.canProceed
                  ? "The current gait metrics would allow the floor-rising screen."
                  : "The current gait metrics would skip floor-rising in the assessment flow."}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="quiet-card grid gap-4 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-2">
            <h2 className="text-xl font-bold">Live accelerometer capture</h2>
            <p className="text-[length:var(--text-label)] text-[var(--muted)]">
              Capture a short walk, summarize samples, then feed the result into
              the gate.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="primary-action text-[length:var(--text-body)]"
              disabled={captureState === "running"}
              onClick={startLiveCapture}
              type="button"
            >
              <Play aria-hidden size={20} />
              Start capture
            </button>
            <button
              className="secondary-action text-[length:var(--text-body)]"
              disabled={captureState === "idle"}
              onClick={stopLiveCapture}
              type="button"
            >
              <Square aria-hidden size={20} />
              Stop capture
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_180px]">
          <div className="callout">
            <p className="text-[length:var(--text-body)]">{captureMessage}</p>
          </div>
          <MetricTile label="Samples" value={String(sampleCount)} />
          <label className="grid gap-2">
            <span className="text-[length:var(--text-label)] font-bold">
              Distance
            </span>
            <select
              className="input-field"
              onChange={(event) => setDistanceMeters(Number(event.target.value))}
              value={distanceMeters}
            >
              {[4, 5, 10].map((distance) => (
                <option key={distance} value={distance}>
                  {distance}m
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
    </div>
  );
}

function RangeField({
  label,
  max,
  min,
  onChange,
  suffix,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  suffix?: string;
  value: number;
}) {
  return (
    <label className="grid gap-2">
      <span className="flex items-center justify-between gap-3 text-[length:var(--text-label)] font-bold">
        {label}
        <span className="font-mono text-[length:var(--text-label)] text-[var(--primary-dark)]">
          {value.toFixed(2)}
          {suffix ? ` ${suffix}` : ""}
        </span>
      </span>
      <input
        className="h-11 w-full accent-[var(--primary)]"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={0.01}
        type="range"
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[length:var(--text-label)] font-bold">
        {label}
      </span>
      <select
        className="input-field"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
      <p className="text-[length:var(--text-caption)] font-bold uppercase tracking-[0.02em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 break-words text-xl font-bold">{value}</p>
    </div>
  );
}

function nowMs() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}
