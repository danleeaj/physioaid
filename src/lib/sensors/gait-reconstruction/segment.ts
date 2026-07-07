import type { UniformSeries } from "@/lib/sensors/gait-reconstruction/types";

const CORRELATION_THRESHOLD = 0.5;
const MIN_REPETITIONS = 3;

export function segmentGaitCycles(series: UniformSeries): number[] {
  const { fs, n } = series;
  const channels = series.gyro ? 6 : 3;
  const signal = buildSignedChannels(series);
  const templateLength = Math.round(2 * fs);
  const templateStep = Math.round(4 * fs);
  const minPeakDistance = Math.round(0.4 * fs);

  let best: { score: number; peaks: number[] } | null = null;

  for (let start = 0; start + templateLength < n; start += templateStep) {
    const corr = slidingCorr(signal, channels, n, start, templateLength);
    const peaks = findPeaks(corr, CORRELATION_THRESHOLD, minPeakDistance);
    if (peaks.length < MIN_REPETITIONS) continue;

    const intervals = diff(peaks);
    const medianInterval = median(intervals);
    const stableIntervals = intervals.filter((interval) => {
      const ratio = interval / medianInterval;
      return ratio >= 0.6 && ratio <= 1.4;
    });
    if (stableIntervals.length < Math.max(2, intervals.length * 0.5)) {
      continue;
    }

    const score = intervals.reduce(
      (total, interval, index) => total + interval * corr[peaks[index]],
      0,
    );

    if (!best || score > best.score) {
      best = { score, peaks };
    }
  }

  if (!best) {
    throw new Error("No repetitive gait pattern");
  }

  const refinedLength = Math.min(...diff(best.peaks));
  const refined = averageSegments(signal, channels, best.peaks, refinedLength);
  const corr = slidingCorrTemplate(signal, channels, n, refined, refinedLength);
  const refinedPeaks = findPeaks(corr, CORRELATION_THRESHOLD, minPeakDistance);

  return refinedPeaks.length >= MIN_REPETITIONS ? refinedPeaks : best.peaks;
}

function buildSignedChannels(series: UniformSeries): Float64Array {
  const channels = series.gyro ? 6 : 3;
  const out = new Float64Array(series.n * channels);
  const radius = Math.max(1, Math.round(series.fs * 0.5));

  for (let axis = 0; axis < 3; axis += 1) {
    const values = new Float64Array(series.n);
    for (let i = 0; i < series.n; i += 1) {
      values[i] = series.accel[i * 3 + axis];
    }
    const slowMean = movingMean(values, radius);
    for (let i = 0; i < series.n; i += 1) {
      out[i * channels + axis] = values[i] - slowMean[i];
    }
  }

  if (series.gyro) {
    for (let i = 0; i < series.n; i += 1) {
      out[i * channels + 3] = series.gyro[i * 3];
      out[i * channels + 4] = series.gyro[i * 3 + 1];
      out[i * channels + 5] = series.gyro[i * 3 + 2];
    }
  }

  return out;
}

function movingMean(values: Float64Array, radius: number): Float64Array {
  const out = new Float64Array(values.length);
  for (let i = 0; i < values.length; i += 1) {
    let total = 0;
    let count = 0;
    const start = Math.max(0, i - radius);
    const end = Math.min(values.length - 1, i + radius);
    for (let j = start; j <= end; j += 1) {
      total += values[j];
      count += 1;
    }
    out[i] = total / count;
  }
  return out;
}

function slidingCorr(
  signal: Float64Array,
  channels: number,
  n: number,
  start: number,
  length: number,
): Float64Array {
  const template = signal.subarray(
    start * channels,
    (start + length) * channels,
  );
  return slidingCorrTemplate(signal, channels, n, template, length);
}

function slidingCorrTemplate(
  signal: Float64Array,
  channels: number,
  n: number,
  template: Float64Array,
  length: number,
): Float64Array {
  const out = new Float64Array(Math.max(0, n - length + 1));
  for (let offset = 0; offset < out.length; offset += 1) {
    let channelTotal = 0;
    for (let channel = 0; channel < channels; channel += 1) {
      channelTotal += pearsonChannel(
        signal,
        template,
        channels,
        offset,
        length,
        channel,
      );
    }
    out[offset] = channelTotal / channels;
  }
  return out;
}

function pearsonChannel(
  signal: Float64Array,
  template: Float64Array,
  channels: number,
  offset: number,
  length: number,
  channel: number,
): number {
  let meanA = 0;
  let meanB = 0;
  for (let i = 0; i < length; i += 1) {
    meanA += template[i * channels + channel];
    meanB += signal[(offset + i) * channels + channel];
  }
  meanA /= length;
  meanB /= length;

  let numerator = 0;
  let denomA = 0;
  let denomB = 0;
  for (let i = 0; i < length; i += 1) {
    const a = template[i * channels + channel] - meanA;
    const b = signal[(offset + i) * channels + channel] - meanB;
    numerator += a * b;
    denomA += a * a;
    denomB += b * b;
  }

  const denom = Math.sqrt(denomA * denomB);
  return denom > 1e-9 ? numerator / denom : 0;
}

function findPeaks(
  values: Float64Array,
  height: number,
  minDistance: number,
): number[] {
  const peaks: number[] = [];
  for (let i = 1; i < values.length - 1; i += 1) {
    if (
      values[i] < height ||
      values[i] <= values[i - 1] ||
      values[i] < values[i + 1]
    ) {
      continue;
    }

    const previousIndex = peaks.at(-1);
    if (previousIndex !== undefined && i - previousIndex < minDistance) {
      if (values[i] > values[previousIndex]) peaks[peaks.length - 1] = i;
    } else {
      peaks.push(i);
    }
  }
  return peaks;
}

function diff(values: number[]): number[] {
  return values.slice(1).map((value, index) => value - values[index]);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function averageSegments(
  signal: Float64Array,
  channels: number,
  peaks: number[],
  length: number,
): Float64Array {
  const out = new Float64Array(length * channels);
  let count = 0;

  for (const peak of peaks) {
    if ((peak + length) * channels > signal.length) continue;
    for (let i = 0; i < length * channels; i += 1) {
      out[i] += signal[peak * channels + i];
    }
    count += 1;
  }

  if (count === 0) return out;
  for (let i = 0; i < out.length; i += 1) out[i] /= count;
  return out;
}
