import {
  accelerationMagnitude,
  estimateSampleRateHz,
  gaitProtocol,
  mean,
  movingAverage,
  standardDeviation,
  validMotionSamples,
} from "@/lib/sensors/gait-protocol";
import type { MotionSample } from "@/types/motion";

export type GaitStep = {
  timestampMs: number;
  amplitude: number;
};

export type GaitCycleSummary = {
  steps: GaitStep[];
  stepIntervalsSeconds: number[];
  centeredSignal: number[];
  smoothedSignal: number[];
  sampleRateHz: number;
};

export function detectGaitCycles(
  samplesInput: MotionSample[],
): GaitCycleSummary {
  const samples = validMotionSamples(samplesInput);
  const magnitudes = samples.map(accelerationMagnitude);
  const averageMagnitude = mean(magnitudes);
  const centeredSignal = magnitudes.map((value) => value - averageMagnitude);
  const smoothedSignal = movingAverage(centeredSignal, 2);
  const threshold = Math.max(0.12, standardDeviation(smoothedSignal) * 0.45);
  const steps = detectStepPeaks(samples, smoothedSignal, threshold);

  return {
    steps,
    stepIntervalsSeconds: stepIntervalsSeconds(steps),
    centeredSignal,
    smoothedSignal,
    sampleRateHz: estimateSampleRateHz(samples),
  };
}

export function stepIntervalsSeconds(steps: GaitStep[]): number[] {
  return steps
    .slice(1)
    .map((step, index) => (step.timestampMs - steps[index].timestampMs) / 1000)
    .filter(
      (interval) =>
        interval >= gaitProtocol.minimumStepIntervalSeconds &&
        interval <= gaitProtocol.maximumStepIntervalSeconds,
    );
}

function detectStepPeaks(
  samples: MotionSample[],
  signal: number[],
  threshold: number,
): GaitStep[] {
  const peaks: GaitStep[] = [];
  const minimumStepIntervalMs = gaitProtocol.minimumStepIntervalSeconds * 1000;

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
