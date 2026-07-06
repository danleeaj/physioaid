"use client";

import { useEffect, useRef, useState } from "react";
import type {
  AbilityConfidenceResult,
  ChairStandMetrics,
  FloorRisingMetrics,
  FallsEfficacyResult,
  MotionMetrics,
  Recommendation,
} from "@/types/assessment";

type AnalysisSource = "ai" | "rule-based";

type AnalysisResult = {
  interpretation: string;
  recommendations: Recommendation[];
  source: AnalysisSource;
  loading: boolean;
};

type SessionMetrics = {
  questionnaire?: FallsEfficacyResult;
  chairStand?: ChairStandMetrics;
  motion?: MotionMetrics;
  floorRising?: FloorRisingMetrics;
};

function buildRequestBody(
  analytics: AbilityConfidenceResult,
  metrics: SessionMetrics,
) {
  const body: Record<string, unknown> = {
    abilityBand: analytics.abilityBand,
    confidenceBand: analytics.confidenceBand,
    profile: analytics.profile,
    riskCategory: analytics.riskCategory,
    fallbackInterpretation: analytics.interpretation,
    fallbackRecommendations: analytics.recommendations.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      type: r.type,
    })),
  };

  if (metrics.chairStand) {
    body.chairStand = {
      completionStatus: metrics.chairStand.completionStatus,
      durationSeconds: metrics.chairStand.durationSeconds,
      repetitions: metrics.chairStand.repetitions,
      movementQuality: metrics.chairStand.movementQuality ?? null,
    };
  }

  if (metrics.motion) {
    body.gait = {
      stabilityScore: metrics.motion.stabilityScore,
      rhythmConsistency: metrics.motion.rhythmConsistency,
      gaitSpeedMetersPerSecond:
        metrics.motion.gaitSpeedMetersPerSecond ?? null,
    };
  }

  if (metrics.floorRising) {
    body.floorRising = {
      completionStatus: metrics.floorRising.completionStatus,
      durationSeconds: metrics.floorRising.durationSeconds ?? null,
      requiredAssistance: metrics.floorRising.requiredAssistance,
      movementQuality: metrics.floorRising.movementQuality ?? null,
    };
  }

  if (metrics.questionnaire) {
    body.confidenceScores = {
      balanceConfidence: metrics.questionnaire.balanceConfidence,
      balanceRecoveryConfidence:
        metrics.questionnaire.balanceRecoveryConfidence,
      safeFallingConfidence: metrics.questionnaire.safeFallingConfidence,
      postFallRecoveryConfidence:
        metrics.questionnaire.postFallRecoveryConfidence,
      averageScore: metrics.questionnaire.averageScore,
    };
  }

  return body;
}

/**
 * Fetches AI-enhanced interpretation and recommendations for an assessment.
 * Returns the rule-based text immediately and swaps in AI text on success.
 * On failure, silently keeps the rule-based text.
 */
export function useAssessmentAnalysis(
  analytics: AbilityConfidenceResult | undefined,
  metrics: SessionMetrics,
): AnalysisResult {
  const [aiResult, setAiResult] = useState<{
    interpretation: string;
    recommendations: Recommendation[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef<string | null>(null);

  const stableKey = analytics
    ? `${analytics.profile}:${analytics.riskCategory}:${analytics.abilityBand}:${analytics.confidenceBand}`
    : null;

  useEffect(() => {
    if (!analytics || !stableKey) return;
    if (fetchedRef.current === stableKey) return;
    fetchedRef.current = stableKey;

    const controller = new AbortController();
    setLoading(true);
    setAiResult(null);

    fetch("/api/assessment-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRequestBody(analytics, metrics)),
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (controller.signal.aborted) return;
        if (
          data &&
          data.source === "ai" &&
          typeof data.interpretation === "string" &&
          data.interpretation.trim() &&
          Array.isArray(data.recommendations) &&
          data.recommendations.length > 0
        ) {
          setAiResult({
            interpretation: data.interpretation,
            recommendations: data.recommendations.map(
              (r: Record<string, string>) => ({
                id: r.id ?? "ai-rec",
                title: r.title ?? "",
                body: r.body ?? "",
                type: r.type ?? "maintain_activity",
              }),
            ),
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
    };
    // metrics is intentionally excluded — the analytics key captures the
    // scoring-relevant state; re-fetching on every draft keystroke would be
    // wasteful and the server sanitizes metrics independently.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analytics, stableKey]);

  if (!analytics) {
    return {
      interpretation: "",
      recommendations: [],
      source: "rule-based",
      loading: false,
    };
  }

  if (aiResult) {
    return {
      interpretation: aiResult.interpretation,
      recommendations: aiResult.recommendations as Recommendation[],
      source: "ai",
      loading,
    };
  }

  return {
    interpretation: analytics.interpretation,
    recommendations: analytics.recommendations,
    source: "rule-based",
    loading,
  };
}
