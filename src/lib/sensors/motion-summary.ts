import type { MotionMetrics } from "@/types/assessment";
import type { MotionSample } from "@/types/motion";

const minimumSampleCount = 12;
const minimumDurationSeconds = 1.5;
const minimumSampleRateHz = 8;
const minimumStepIntervalMs = 300;
const maximumStepIntervalMs = 1400;

export function getDemoMotionMetrics(): MotionMetrics {
  return {
    stabilityScore: 0.62,
    rhythmConsistency: 0.58,
    gaitSpeedMetersPerSecond: 0.82,
    completionStatus: "demo",
    source: "demo",
  };
}

export function getUnavailableMotionMetrics(
  source: "accelerometer" | "manual" = "manual",
): MotionMetrics {
  return {
    stabilityScore: 0,
    rhythmConsistency: 0,
    completionStatus: "stopped",
    source,
  };
}

export function summarizeMotionSamples(input: {
  samples: MotionSample[];
  distanceMeters?: number;
  durationSeconds: number;
}): MotionMetrics {
  const samples = input.samples
    .filter(isValidSample)
    .sort((a, b) => a.timestampMs - b.timestampMs);

  if (
    samples.length < minimumSampleCount ||
    input.durationSeconds < minimumDurationSeconds
  ) {
    return getUnavailableMotionMetrics("accelerometer");
  }

  const sampleSpanSeconds =
    (samples[samples.length - 1].timestampMs - samples[0].timestampMs) / 1000;
  const sampleRateHz =
    sampleSpanSeconds > 0 ? (samples.length - 1) / sampleSpanSeconds : 0;

  if (
    sampleSpanSeconds <= 0 ||
    input.durationSeconds <= 0 ||
    sampleRateHz < minimumSampleRateHz
  ) {
    return getUnavailableMotionMetrics("accelerometer");
  }

  const magnitudes = samples.map((sample) => accelerationMagnitude(sample));
  const averageMagnitude = mean(magnitudes);
  const centeredMagnitudes = magnitudes.map((value) => value - averageMagnitude);
  const smoothedMagnitudes = movingAverage(centeredMagnitudes, 2);
  const peaks = detectStepPeaks(samples, smoothedMagnitudes);
  const stepIntervalsSeconds = peaks
    .slice(1)
    .map((peak, index) => (peak.timestampMs - peaks[index].timestampMs) / 1000)
    .filter(
      (interval) =>
        interval >= minimumStepIntervalMs / 1000 &&
        interval <= maximumStepIntervalMs / 1000,
    );

  return {
    stabilityScore: scoreStability({
      peaks,
      samples,
      signal: smoothedMagnitudes,
    }),
    rhythmConsistency: scoreRhythmConsistency({
      durationSeconds: input.durationSeconds,
      peaks,
      stepIntervalsSeconds,
    }),
    gaitSpeedMetersPerSecond:
      input.distanceMeters !== undefined
        ? Number((input.distanceMeters / input.durationSeconds).toFixed(2))
        : undefined,
    completionStatus: "completed",
    source: "accelerometer",
  };
}

type StepPeak = {
  amplitude: number;
  timestampMs: number;
};

function isValidSample(sample: MotionSample) {
  return (
    Number.isFinite(sample.timestampMs) &&
    Number.isFinite(sample.accelerationX) &&
    Number.isFinite(sample.accelerationY) &&
    Number.isFinite(sample.accelerationZ)
  );
}

function accelerationMagnitude(sample: MotionSample) {
  return Math.hypot(
    sample.accelerationX,
    sample.accelerationY,
    sample.accelerationZ,
  );
}

function detectStepPeaks(samples: MotionSample[], signal: number[]): StepPeak[] {
  const signalDeviation = standardDeviation(signal);
  const threshold = Math.max(0.03, signalDeviation * 0.35);
  const peaks: StepPeak[] = [];

  for (let index = 1; index < signal.length - 1; index += 1) {
    const value = signal[index];
    if (
      value < threshold ||
      value <= signal[index - 1] ||
      value < signal[index + 1]
    ) {
      continue;
    }

    const peak = {
      amplitude: Math.abs(value),
      timestampMs: samples[index].timestampMs,
    };
    const previousPeak = peaks.at(-1);

    if (
      previousPeak &&
      peak.timestampMs - previousPeak.timestampMs < minimumStepIntervalMs
    ) {
      if (peak.amplitude > previousPeak.amplitude) {
        peaks[peaks.length - 1] = peak;
      }
      continue;
    }

    peaks.push(peak);
  }

  return peaks;
}

function scoreRhythmConsistency({
  durationSeconds,
  peaks,
  stepIntervalsSeconds,
}: {
  durationSeconds: number;
  peaks: StepPeak[];
  stepIntervalsSeconds: number[];
}) {
  if (stepIntervalsSeconds.length < 2) {
    return peaks.length >= Math.max(3, durationSeconds) ? 0.45 : 0.25;
  }

  const averageInterval = mean(stepIntervalsSeconds);
  const intervalVariation = coefficientOfVariation(stepIntervalsSeconds);
  const stepFrequencyHz = averageInterval > 0 ? 1 / averageInterval : 0;
  const cadencePenalty =
    stepFrequencyHz < 0.7 || stepFrequencyHz > 3 ? 0.2 : 0;

  return clamp01(1 - intervalVariation / 0.35 - cadencePenalty);
}

function scoreStability({
  peaks,
  samples,
  signal,
}: {
  peaks: StepPeak[];
  samples: MotionSample[];
  signal: number[];
}) {
  const accelerationPenalty = clamp01(rms(signal) / 6);
  const jerkPenalty = clamp01(rms(getJerkValues(samples, signal)) / 80);
  const rotationPenalty = clamp01(rms(getRotationMagnitudes(samples)) / 160);
  const amplitudePenalty =
    peaks.length >= 3
      ? clamp01(coefficientOfVariation(peaks.map((peak) => peak.amplitude)) / 0.8)
      : 0.35;

  return clamp01(
    1 -
      (amplitudePenalty * 0.35 +
        rotationPenalty * 0.25 +
        jerkPenalty * 0.25 +
        accelerationPenalty * 0.15),
  );
}

function getJerkValues(samples: MotionSample[], signal: number[]) {
  const values: number[] = [];

  for (let index = 1; index < signal.length; index += 1) {
    const seconds =
      (samples[index].timestampMs - samples[index - 1].timestampMs) / 1000;
    if (seconds > 0) {
      values.push(Math.abs((signal[index] - signal[index - 1]) / seconds));
    }
  }

  return values;
}

function getRotationMagnitudes(samples: MotionSample[]) {
  return samples
    .map((sample) =>
      Math.hypot(
        sample.rotationAlpha ?? 0,
        sample.rotationBeta ?? 0,
        sample.rotationGamma ?? 0,
      ),
    )
    .filter((value) => value > 0);
}

function movingAverage(values: number[], radius: number) {
  return values.map((_, index) => {
    const start = Math.max(0, index - radius);
    const end = Math.min(values.length, index + radius + 1);
    return mean(values.slice(start, end));
  });
}

function coefficientOfVariation(values: number[]) {
  const average = mean(values);
  if (average === 0) {
    return 1;
  }

  return standardDeviation(values) / Math.abs(average);
}

function mean(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function rms(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.sqrt(mean(values.map((value) => value ** 2)));
}

function standardDeviation(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, Number(value.toFixed(2))));
}
