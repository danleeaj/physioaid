# Configuration Guide

All clinical wording, thresholds, and recommendation content should be centralised so Shaun can review without changing component logic.

## Suggested config files

```txt
src/config/clinical-config.ts
src/config/thresholds.ts
src/content/clinical-copy.ts
src/content/recommendations.ts
src/content/care-linkage.ts
```

## Product constants

```ts
export const PRODUCT_NAME = "Physio-Aid";

export const PRODUCT_POSITIONING =
  "A web-based physiotherapy support platform for healthspan, frailty, and falls-related decision support.";

export const DECISION_SUPPORT_DISCLAIMER =
  "Physio-Aid provides decision support and screening information. It is not a diagnosis and does not replace assessment by a qualified healthcare professional.";
```

## Questionnaire config

```ts
export const fallsEfficacyQuestions = [
  {
    id: "balanceConfidence",
    domain: "Balance confidence",
    prompt: "How confident are you that you can keep your balance during everyday walking or standing tasks?",
    min: 0,
    max: 10
  },
  {
    id: "balanceRecoveryConfidence",
    domain: "Balance recovery confidence",
    prompt: "How confident are you that you can recover your balance if you feel unsteady?",
    min: 0,
    max: 10
  },
  {
    id: "safeFallingConfidence",
    domain: "Safe-falling confidence",
    prompt: "How confident are you that you know how to protect yourself if you start to fall?",
    min: 0,
    max: 10
  },
  {
    id: "postFallRecoveryConfidence",
    domain: "Post-fall recovery confidence",
    prompt: "How confident are you that you can get help or recover safely after a fall?",
    min: 0,
    max: 10
  }
];
```

These prompts are MVP placeholders and require Shaun review.

## Safety screen config

```ts
export const safetyQuestions = [
  { id: "dizziness", label: "Are you feeling dizzy today?", blocksTest: true },
  { id: "breathlessness", label: "Are you unusually breathless today?", blocksTest: true },
  { id: "pain", label: "Do you have chest pain, severe pain, or pain that makes standing unsafe?", blocksTest: true },
  { id: "recentFallOrInjury", label: "Have you had a recent fall or injury that has not been reviewed?", blocksTest: true },
  { id: "needsSupervision", label: "Do you need someone nearby to stand safely?", blocksTest: false }
];
```

## Threshold config

These are hackathon placeholders. Do not present them as clinically validated.

```ts
export const thresholds = {
  confidenceLowBelow: 6,
  chairStand: {
    goodDurationSecondsOrLess: 12,
    poorDurationSecondsOver: 20,
    minimumRepetitions: 5
  },
  motion: {
    lowStabilityBelow: 0.45,
    lowRhythmConsistencyBelow: 0.5
  }
};
```

## Profile copy

```ts
export const profileCopy = {
  stable_profile: {
    title: "Stable ability–confidence profile",
    interpretation: "Your movement ability and confidence appear aligned in this screening summary."
  },
  under_confidence: {
    title: "Good ability with lower confidence",
    interpretation: "You may be avoiding movement despite reasonable ability. Confidence-building and graded practice may help."
  },
  possible_risk_taking: {
    title: "Reduced ability with higher confidence",
    interpretation: "You may be more confident than your current movement performance suggests. Supervised support and safety awareness may be helpful."
  },
  high_vulnerability: {
    title: "Reduced ability with lower confidence",
    interpretation: "Your screening summary suggests both functional and confidence concerns. Consider supported practice and further review."
  }
};
```

## Recommendation categories

```ts
type RecommendationType =
  | "maintain_activity"
  | "confidence_building"
  | "balance_recovery"
  | "strengthening"
  | "supervised_practice"
  | "community_linkage"
  | "physiotherapy_review"
  | "urgent_safety_advice";
```

## Care linkage config

```ts
export const careLinkageOptions = [
  {
    id: "active_ageing_centre",
    title: "Active Ageing Centre",
    description: "Consider community-based activity, screening, or support."
  },
  {
    id: "community_health_post",
    title: "Community Health Post",
    description: "Consider review or care navigation if functional concerns are present."
  },
  {
    id: "physiotherapy_clinic",
    title: "Physiotherapy Clinic",
    description: "Consider physiotherapy review for persistent, worsening, or higher-risk concerns."
  }
];
```

## Config acceptance criteria

- Clinical copy is not hard-coded in multiple components.
- Questionnaire wording can be reviewed and changed quickly.
- Thresholds are centralised.
- Recommendation copy uses care recommendation language.
- Report disclaimer appears in config.
- No config string uses diagnosis or prescription wording.
