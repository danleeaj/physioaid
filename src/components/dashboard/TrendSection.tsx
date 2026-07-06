"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { shellCopy } from "@/components/layout/copy";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  buildComputedTrendSummary,
  computeTrends,
  formatTrendValue,
  TREND_SUMMARY_MAX_CHARS,
  type TrendDirection,
  type TrendReport,
} from "@/lib/analytics/trends";
import type { AssessmentSession } from "@/types/assessment";

/** Direction is always icon + word — never color-only. */
const DIRECTION_ICONS: Record<
  TrendDirection,
  typeof TrendingUp
> = {
  improved: TrendingUp,
  steady: Minus,
  declined: TrendingDown,
};

const DIRECTION_COLORS: Record<TrendDirection, string> = {
  improved: "bg-[var(--success-soft)] text-[var(--success)]",
  steady: "bg-[var(--warning-soft)] text-[var(--warning)]",
  declined: "bg-[var(--danger-soft)] text-[var(--danger)]",
};

/** Coarse whole-day gap between the two compared checks (clamped 1–730). */
function daysBetweenFromReport(report: TrendReport): number {
  const first = report.trends[0];
  if (!first) return 1;
  const ms = Date.parse(first.latestDate) - Date.parse(first.previousDate);
  const days = Math.round(Math.abs(ms) / 86_400_000);
  return Math.min(730, Math.max(1, Number.isFinite(days) ? days : 1));
}

/**
 * PII-free request body for /api/trend-summary: whitelisted metric ids,
 * directions, deltas, numeric risk bands, and a coarse day count. Never
 * names, ages, dates, or session ids.
 */
function buildSummaryPayload(report: TrendReport, computedFallback: string) {
  const overall = report.trends.find((trend) => trend.metric === "overall");
  return {
    trends: report.trends.slice(0, 6).map((trend) => ({
      metric: trend.metric,
      direction: trend.direction,
      delta: trend.delta,
      unit: trend.unit,
    })),
    ...(overall
      ? { riskBand: { latest: overall.latest, previous: overall.previous } }
      : {}),
    missing: report.missing.map((item) => item.metric),
    daysBetween: daysBetweenFromReport(report),
    computedFallback,
  };
}

/**
 * Trend dashboard for the Assessment home: per-metric comparison cards over
 * the two most recent checks plus a plain-language summary. The AI summary
 * route is called only with the user's AI-insight consent; otherwise (and on
 * any failure) the deterministic on-device summary renders instead.
 */
export function TrendSection({ sessions }: { sessions: AssessmentSession[] }) {
  const { profile } = useUserProfile();
  const { lang } = useLanguage();
  const copy = shellCopy[lang].trends;
  const report = useMemo(() => computeTrends(sessions), [sessions]);
  const computedSummary = useMemo(
    () => (report ? buildComputedTrendSummary(report) : ""),
    [report],
  );
  // Consent must be explicitly true — false or absent means no network call.
  const aiConsent = profile?.consents.aiInsightConsent === true;
  // Ties an AI response to the exact report it was requested for, so a
  // just-saved assessment never shows a stale summary.
  const reportKey = useMemo(
    () => (report ? JSON.stringify(buildSummaryPayload(report, "")) : ""),
    [report],
  );
  const [aiSummary, setAiSummary] = useState<{
    key: string;
    text: string;
  } | null>(null);

  useEffect(() => {
    // No comparable report → no card and never a fetch; consent off → the
    // computed summary renders locally with zero network traffic.
    if (!report || !aiConsent) return;
    let cancelled = false;
    fetch("/api/trend-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSummaryPayload(report, computedSummary)),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (
          data &&
          data.source === "ai" &&
          typeof data.summary === "string" &&
          data.summary.trim()
        ) {
          setAiSummary({
            key: reportKey,
            text: data.summary.slice(0, TREND_SUMMARY_MAX_CHARS),
          });
        }
        // source "computed" (or malformed) → the local computed summary,
        // already rendered, stays.
      })
      .catch(() => {
        // Network failure → computed summary already rendered.
      });
    return () => {
      cancelled = true;
    };
  }, [report, aiConsent, computedSummary, reportKey]);

  if (!report) {
    return (
      <section className="grid grid-cols-1 gap-2">
        <h2 className="px-1 text-[length:var(--text-body)] font-bold">
          {copy.title}
        </h2>
        <p className="app-card text-[length:var(--text-label)] text-[var(--muted)]">
          {copy.emptyState}
        </p>
      </section>
    );
  }

  const activeAiSummary =
    aiConsent && aiSummary && aiSummary.key === reportKey
      ? aiSummary.text
      : null;

  return (
    <section className="grid grid-cols-1 gap-2">
      <h2 className="px-1 text-[length:var(--text-body)] font-bold">
        {copy.title}
      </h2>

      {report.trends.map((trend) => {
        const DirectionIcon = DIRECTION_ICONS[trend.direction];
        return (
          <div className="app-card grid gap-1" key={trend.metric}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[length:var(--text-caption)] font-bold uppercase tracking-wide text-[var(--muted)]">
                {copy.metrics[trend.metric]}
              </p>
              <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[length:var(--text-label)] font-bold ${DIRECTION_COLORS[trend.direction]}`}>
                <DirectionIcon aria-hidden size={16} />
                {copy.direction[trend.direction]}
              </span>
            </div>
            <p className="text-[length:var(--text-lead)] font-bold">
              {formatTrendValue(trend.unit, trend.previous)} →{" "}
              {formatTrendValue(trend.unit, trend.latest)}
            </p>
            {trend.caveats.map((caveat) => (
              <p
                className="text-[length:var(--text-label)] text-[var(--muted)]"
                key={caveat}
              >
                {caveat}
              </p>
            ))}
          </div>
        );
      })}

      {report.missing.length > 0 && (
        <div className="app-card grid gap-1">
          <p className="text-[length:var(--text-caption)] font-bold uppercase tracking-wide text-[var(--muted)]">
            {copy.missingTitle}
          </p>
          {report.missing.map((item) => (
            <p
              className="text-[length:var(--text-label)] text-[var(--muted)]"
              key={item.metric}
            >
              {item.reason}
            </p>
          ))}
        </div>
      )}

      <div className="app-card grid gap-1">
        <p className="text-[length:var(--text-caption)] font-bold uppercase tracking-wide text-[var(--muted)]">
          {activeAiSummary ? copy.summaryTitleAi : copy.summaryTitle}
        </p>
        <p className="text-[length:var(--text-label)]">
          {activeAiSummary ?? computedSummary}
        </p>
        {report.globalCaveats.map((caveat) => (
          <p
            className="text-[length:var(--text-caption)] text-[var(--muted)]"
            key={caveat}
          >
            {caveat}
          </p>
        ))}
      </div>
    </section>
  );
}
