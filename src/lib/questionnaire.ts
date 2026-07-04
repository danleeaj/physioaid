import type { FallsEfficacyResult } from "@/types/assessment";

export function scoreFallsEfficacy(
  scores: Omit<FallsEfficacyResult, "averageScore">,
): FallsEfficacyResult {
  const values = [
    scores.balanceConfidence,
    scores.balanceRecoveryConfidence,
    scores.safeFallingConfidence,
    scores.postFallRecoveryConfidence,
  ];

  return {
    ...scores,
    averageScore:
      values.reduce((total, value) => total + value, 0) / values.length,
  };
}
