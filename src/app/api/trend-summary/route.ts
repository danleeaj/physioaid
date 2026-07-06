import { NextResponse } from "next/server";

/**
 * AI trend-summary seam — mirrors `/api/recommend-activities`.
 *
 * When OPENAI_API_KEY is configured (server-side env, never NEXT_PUBLIC),
 * the handler asks the OpenAI Chat Completions API for a short, supportive
 * plain-language summary of the participant's mobility trends. The request
 * body is sanitized to a strict whitelist BEFORE anything reaches the model:
 * metric ids and directions from fixed enums, clamped finite numbers, and a
 * coarse day count — never names, ages, dates, session ids, or free text.
 *
 * Without a key — or on any timeout, API error, or malformed response — the
 * handler echoes the client-computed deterministic summary, so the route
 * never fails to the client. The response `source` field is honest about
 * which path produced the result ("ai" vs "computed").
 */

const OPENAI_TIMEOUT_MS = 5000;
const MAX_TRENDS = 6;
const MAX_SUMMARY_CHARS = 400;
const MAX_DAYS_BETWEEN = 730;

const TREND_METRICS = new Set([
  "overall",
  "confidence",
  "sit_to_stand",
  "gait_speed",
  "floor_rising",
  "timed_up_and_go",
  "functional_reach",
]);
const TREND_DIRECTIONS = new Set(["improved", "steady", "declined"]);
const TREND_UNITS = new Set(["score", "seconds", "m/s", "band"]);

type SanitizedTrend = {
  metric: string;
  direction: string;
  delta: number;
  unit: string;
};

type SanitizedPayload = {
  trends: SanitizedTrend[];
  riskBand: { latest: number; previous: number } | null;
  missing: string[];
  daysBetween: number;
  computedFallback: string;
};

function stripControlChars(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, " ");
}

function clampNumber(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.min(max, Math.max(min, value));
}

/**
 * Reduce whatever arrived on the wire to the strict shape the model may see.
 * Unknown fields are dropped, enums whitelisted, numbers clamped, and the
 * fallback text bounded and stripped of control characters.
 */
function sanitizePayload(raw: unknown): SanitizedPayload {
  const body =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const trends: SanitizedTrend[] = [];
  if (Array.isArray(body.trends)) {
    for (const item of body.trends) {
      if (trends.length === MAX_TRENDS) break;
      if (!item || typeof item !== "object") continue;
      const candidate = item as Record<string, unknown>;
      const delta = clampNumber(candidate.delta, -1000, 1000);
      if (
        typeof candidate.metric === "string" &&
        TREND_METRICS.has(candidate.metric) &&
        typeof candidate.direction === "string" &&
        TREND_DIRECTIONS.has(candidate.direction) &&
        typeof candidate.unit === "string" &&
        TREND_UNITS.has(candidate.unit) &&
        delta !== null &&
        !trends.some((t) => t.metric === candidate.metric)
      ) {
        trends.push({
          metric: candidate.metric,
          direction: candidate.direction,
          delta,
          unit: candidate.unit,
        });
      }
    }
  }

  let riskBand: SanitizedPayload["riskBand"] = null;
  if (body.riskBand && typeof body.riskBand === "object") {
    const candidate = body.riskBand as Record<string, unknown>;
    const latest = clampNumber(candidate.latest, 0, 2);
    const previous = clampNumber(candidate.previous, 0, 2);
    if (latest !== null && previous !== null) {
      riskBand = { latest: Math.round(latest), previous: Math.round(previous) };
    }
  }

  const missing = Array.isArray(body.missing)
    ? body.missing
        .filter(
          (item): item is string =>
            typeof item === "string" && TREND_METRICS.has(item),
        )
        .slice(0, TREND_METRICS.size)
    : [];

  const daysBetween = Math.round(
    clampNumber(body.daysBetween, 1, MAX_DAYS_BETWEEN) ?? 1,
  );

  const computedFallback =
    typeof body.computedFallback === "string"
      ? stripControlChars(body.computedFallback)
          .slice(0, MAX_SUMMARY_CHARS)
          .trim()
      : "";

  return { trends, riskBand, missing, daysBetween, computedFallback };
}

async function aiSummary(
  apiKey: string,
  payload: SanitizedPayload,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You write a short, warm, plain-language summary of mobility-check trends for an older adult. " +
              "You provide decision support only — never a diagnosis, never medical or medication advice. " +
              "Data: 'band' metrics use 0=low, 1=moderate, 2=higher support (lower is better); " +
              "'seconds' metrics are timed tests where lower is better; confidence 'score' and 'm/s' are higher-is-better. " +
              "'missing' lists checks that could not be compared this time. " +
              "Celebrate improvements, present 'declined' calmly as a change worth attention (never alarming language), " +
              "and encourage sharing the results with a physiotherapist. " +
              "Keep it under 400 characters. " +
              'Reply with strict JSON: {"summary":"<summary>"}',
          },
          {
            role: "user",
            content: JSON.stringify({
              trends: payload.trends,
              riskBand: payload.riskBand ?? undefined,
              missing: payload.missing,
              daysBetween: payload.daysBetween,
            }),
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;
    const parsed = JSON.parse(content);
    if (typeof parsed?.summary !== "string" || !parsed.summary.trim()) {
      return null;
    }
    return stripControlChars(parsed.summary).slice(0, MAX_SUMMARY_CHARS).trim();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  let raw: unknown = null;
  try {
    raw = await request.json();
  } catch {
    // Malformed body → sanitized defaults below; the route never errors.
  }
  const payload = sanitizePayload(raw);

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && payload.trends.length > 0) {
    const summary = await aiSummary(apiKey, payload);
    if (summary) {
      return NextResponse.json({ source: "ai", summary });
    }
  }

  return NextResponse.json({
    source: "computed",
    summary: payload.computedFallback,
  });
}
