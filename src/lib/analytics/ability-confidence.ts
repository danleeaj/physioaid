import { profileCopy } from "@/content/clinical-copy";
import { baseRecommendations } from "@/content/recommendations";
import { thresholds } from "@/config/thresholds";
import type {
  AbilityBand,
  AbilityConfidenceProfile,
  AbilityConfidenceResult,
  ChairStandMetrics,
  ConfidenceBand,
  FallsEfficacyResult,
  MotionMetrics,
  RiskCategory,
} from "@/types/assessment";

export function analyseAssessment(input: {
  questionnaire: FallsEfficacyResult;
  chairStand: ChairStandMetrics;
  motion?: MotionMetrics;
}): AbilityConfidenceResult {
  const abilityBand = getAbilityBand(input.chairStand, input.motion);
  const confidenceBand = getConfidenceBand(input.questionnaire);
  const profile = getProfile(abilityBand, confidenceBand);
  const riskCategory = getRiskCategory(profile, abilityBand, input.chairStand);

  return {
    abilityBand,
    confidenceBand,
    profile,
    riskCategory,
    interpretation: profileCopy[profile].interpretation,
    recommendations: baseRecommendations[riskCategory],
  };
}

function getAbilityBand(
  chairStand: ChairStandMetrics,
  motion?: MotionMetrics,
): AbilityBand {
  if (chairStand.completionStatus === "stopped") {
    return "poor";
  }

  const lowMotionStability =
    motion !== undefined &&
    motion.stabilityScore < thresholds.motion.lowStabilityBelow;

  if (
    chairStand.repetitions < thresholds.chairStand.minimumRepetitions ||
    chairStand.durationSeconds > thresholds.chairStand.poorDurationSecondsOver ||
    lowMotionStability
  ) {
    return "poor";
  }

  if (
    chairStand.durationSeconds <=
      thresholds.chairStand.goodDurationSecondsOrLess &&
    chairStand.movementQuality !== "variable"
  ) {
    return "good";
  }

  return "reduced";
}

function getConfidenceBand(questionnaire: FallsEfficacyResult): ConfidenceBand {
  return questionnaire.averageScore < thresholds.confidenceLowBelow
    ? "low"
    : "good";
}

function getProfile(
  abilityBand: AbilityBand,
  confidenceBand: ConfidenceBand,
): AbilityConfidenceProfile {
  const goodAbility = abilityBand === "good";

  if (goodAbility && confidenceBand === "good") {
    return "stable_profile";
  }

  if (goodAbility && confidenceBand === "low") {
    return "under_confidence";
  }

  if (!goodAbility && confidenceBand === "good") {
    return "possible_risk_taking";
  }

  return "high_vulnerability";
}

function getRiskCategory(
  profile: AbilityConfidenceProfile,
  abilityBand: AbilityBand,
  chairStand: ChairStandMetrics,
): RiskCategory {
  if (
    chairStand.completionStatus === "stopped" ||
    profile === "high_vulnerability"
  ) {
    return "high";
  }

  if (abilityBand === "poor" || profile === "possible_risk_taking") {
    return "moderate";
  }

  return profile === "under_confidence" ? "moderate" : "low";
}
