import type { MotionSample } from "@/types/motion";

export const gaitProtocol = {
  targetDurationSeconds: 25,
  minDurationSeconds: 20,
  maxDurationSeconds: 30,
  minSampleRateHz: 20,
  minValidSamples: 240,
  minSignalRange: 0.15,
  minDetectedSteps: 8,
  minimumStepIntervalSeconds: 0.3,
  maximumStepIntervalSeconds: 1.4,
} as const;

export type GaitCaptureIssue =
  | "ok"
  | "invalid_duration"
  | "duration_too_short"
  | "duration_too_long"
  | "not_enough_samples"
  | "low_sample_rate"
  | "static_signal";

export type GaitCaptureQuality = {
  usable: boolean;
  issue: GaitCaptureIssue;
  durationSeconds: number;
  validSampleCount: number;
  sampleRateHz: number;
  signalRange: number;
};

export function validMotionSamples(samples: MotionSample[]): MotionSample[] {
  return samples
    .filter(isValidSample)
    .sort((a, b) => a.timestampMs - b.timestampMs);
}

export function validateGaitCapture(input: {
  samples: MotionSample[];
  durationSeconds: number;
}): GaitCaptureQuality {
  const samples = validMotionSamples(input.samples);
  const durationSeconds = input.durationSeconds;
  const sampleRateHz = estimateSampleRateHz(samples);
  const signalRange = accelerationSignalRange(samples);

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return quality(
      "invalid_duration",
      durationSeconds,
      samples,
      sampleRateHz,
      signalRange,
    );
  }

  if (durationSeconds < gaitProtocol.minDurationSeconds) {
    return quality(
      "duration_too_short",
      durationSeconds,
      samples,
      sampleRateHz,
      signalRange,
    );
  }

  if (durationSeconds > gaitProtocol.maxDurationSeconds) {
    return quality(
      "duration_too_long",
      durationSeconds,
      samples,
      sampleRateHz,
      signalRange,
    );
  }

  if (samples.length < gaitProtocol.minValidSamples) {
    return quality(
      "not_enough_samples",
      durationSeconds,
      samples,
      sampleRateHz,
      signalRange,
    );
  }

  if (sampleRateHz < gaitProtocol.minSampleRateHz) {
    return quality(
      "low_sample_rate",
      durationSeconds,
      samples,
      sampleRateHz,
      signalRange,
    );
  }

  if (signalRange < gaitProtocol.minSignalRange) {
    return quality(
      "static_signal",
      durationSeconds,
      samples,
      sampleRateHz,
      signalRange,
    );
  }

  return quality("ok", durationSeconds, samples, sampleRateHz, signalRange);
}

export function accelerationMagnitude(sample: MotionSample): number {
  return Math.hypot(
    sample.accelerationX,
    sample.accelerationY,
    sample.accelerationZ,
  );
}

export function estimateSampleRateHz(samples: MotionSample[]): number {
  if (samples.length < 2) return 0;
  const first = samples[0].timestampMs;
  const last = samples[samples.length - 1].timestampMs;
  const spanSeconds = (last - first) / 1000;
  if (spanSeconds <= 0) return 0;
  return (samples.length - 1) / spanSeconds;
}

export function accelerationSignalRange(samples: MotionSample[]): number {
  if (samples.length === 0) return 0;
  const magnitudes = samples.map(accelerationMagnitude);
  return Math.max(...magnitudes) - Math.min(...magnitudes);
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

export function coefficientOfVariation(values: number[]): number {
  const average = mean(values);
  if (average === 0) return 1;
  return standardDeviation(values) / Math.abs(average);
}

export function rms(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.sqrt(mean(values.map((value) => value ** 2)));
}

export function movingAverage(values: number[], radius: number): number[] {
  return values.map((_, index) => {
    const start = Math.max(0, index - radius);
    const end = Math.min(values.length, index + radius + 1);
    return mean(values.slice(start, end));
  });
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number(value.toFixed(2))));
}

function isValidSample(sample: MotionSample): boolean {
  return (
    Number.isFinite(sample.timestampMs) &&
    Number.isFinite(sample.accelerationX) &&
    Number.isFinite(sample.accelerationY) &&
    Number.isFinite(sample.accelerationZ)
  );
}

function quality(
  issue: GaitCaptureIssue,
  durationSeconds: number,
  samples: MotionSample[],
  sampleRateHz: number,
  signalRange: number,
): GaitCaptureQuality {
  return {
    usable: issue === "ok",
    issue,
    durationSeconds,
    validSampleCount: samples.length,
    sampleRateHz: Number(sampleRateHz.toFixed(1)),
    signalRange: Number(signalRange.toFixed(2)),
  };
}
