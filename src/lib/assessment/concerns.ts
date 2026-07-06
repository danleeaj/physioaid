import type { AssessmentSession, TestId } from "@/types/assessment";

/**
 * Derive anonymous concern tags from a completed assessment session.
 * Used to build the PII-free request body for clinic recommendation.
 */
export function extractConcerns(session: AssessmentSession): string[] {
  const concerns: string[] = [];

  if (session.questionnaire && session.questionnaire.averageScore < 6) {
    concerns.push("low_confidence");
  }

  if (session.chairStand) {
    if (
      session.chairStand.durationSeconds > 15 ||
      session.chairStand.repetitions < 5
    ) {
      concerns.push("reduced_lower_limb_strength");
    }
  }

  if (session.motion) {
    if (
      session.motion.gaitSpeedMetersPerSecond != null &&
      session.motion.gaitSpeedMetersPerSecond < 0.8
    ) {
      concerns.push("slow_gait");
    }
    if (session.motion.stabilityScore < 0.6) {
      concerns.push("poor_balance");
    }
  }

  if (session.floorRising) {
    if (
      session.floorRising.completionStatus === "stopped" ||
      session.floorRising.requiredAssistance
    ) {
      concerns.push("floor_rising_difficulty");
    }
  }

  return concerns;
}

export function extractCompletedTests(session: AssessmentSession): TestId[] {
  const tests: TestId[] = [];
  if (session.questionnaire) tests.push("self_confidence");
  if (session.chairStand) tests.push("sit_to_stand");
  if (session.motion) tests.push("walk");
  if (session.floorRising) tests.push("floor_rising");
  return tests;
}
