import type { AbilityConfidenceProfile } from "@/types/assessment";

export const fallsEfficacyQuestions = [
  {
    id: "balanceConfidence",
    domain: "Balance confidence",
    prompt:
      "How confident are you that you can keep your balance during everyday walking or standing tasks?",
    min: 0,
    max: 10,
  },
  {
    id: "balanceRecoveryConfidence",
    domain: "Balance recovery confidence",
    prompt:
      "How confident are you that you can recover your balance if you feel unsteady?",
    min: 0,
    max: 10,
  },
  {
    id: "safeFallingConfidence",
    domain: "Safe-falling confidence",
    prompt:
      "How confident are you that you know how to protect yourself if you start to fall?",
    min: 0,
    max: 10,
  },
  {
    id: "postFallRecoveryConfidence",
    domain: "Post-fall recovery confidence",
    prompt:
      "How confident are you that you can get help or recover safely after a fall?",
    min: 0,
    max: 10,
  },
] as const;

export const profileCopy: Record<
  AbilityConfidenceProfile,
  { title: string; interpretation: string }
> = {
  stable_profile: {
    title: "Stable ability-confidence profile",
    interpretation:
      "Movement ability and confidence appear aligned in this screening summary.",
  },
  under_confidence: {
    title: "Good ability with lower confidence",
    interpretation:
      "This pattern may suggest movement avoidance despite reasonable ability. Confidence-building and graded practice may help.",
  },
  possible_risk_taking: {
    title: "Reduced ability with higher confidence",
    interpretation:
      "This pattern may suggest confidence is higher than current movement performance. Supervised support and safety awareness may be helpful.",
  },
  high_vulnerability: {
    title: "Reduced ability with lower confidence",
    interpretation:
      "This screening summary suggests both functional and confidence concerns. Consider supported practice and further review.",
  },
};
