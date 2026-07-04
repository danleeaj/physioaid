# Questionnaire Agent

## Goal

Build the falls efficacy questionnaire UI, validation, scoring, and confidence-band output for the MVP.

## Context from Shaun’s brief

Physio-Aid is a web-based physiotherapy support platform focused on prolonging healthspan by preventing frailty progression and falls in older adults. The brief centres the MVP on safety screening, falls efficacy, chair stand assessment, sensor/CV analytics, an ability–confidence profile, risk stratification, recommendations, and linkage to Active Ageing Centres, Community Health Posts, or Physiotherapy Clinics. The tool is decision support, not diagnosis. The brief specifies four confidence domains: balance confidence, balance recovery confidence, safe-falling confidence, and post-fall recovery confidence.

## Responsibilities

- Render the four falls efficacy questions.
- Use large, accessible inputs suitable for older adults.
- Calculate average confidence score.
- Return confidence band for analytics.
- Keep question wording configurable for Shaun review.
- Validate that all four questions are answered before proceeding.

## Inputs

- Question config from `src/config/clinical-config.ts`
- Current assessment session ID
- User responses

## Outputs

- `FallsEfficacyResult` object
- Validation errors
- UI state for completion

## Files it owns

- `src/components/assessment/FallsEfficacyStep.tsx`
- `src/lib/questionnaire.ts`
- `src/types/questionnaire.ts`
- `tests/unit/questionnaire.test.ts`

## Files it must not edit

- `src/lib/analytics/**` beyond consuming threshold constants
- `src/lib/sensors/**`
- `src/lib/vision/**`
- `src/server/storage/**`
- Clinical wording files unless coordinated with clinical agent

## Integration contract

The questionnaire agent must return:

```ts
type FallsEfficacyResult = {
  balanceConfidence: number;
  balanceRecoveryConfidence: number;
  safeFallingConfidence: number;
  postFallRecoveryConfidence: number;
  averageConfidence: number;
  confidenceBand: "good" | "low";
};
```

The analytics agent consumes this object. The frontend stores it in the assessment session.

## Acceptance criteria

- All four domains are present.
- Scores are numeric and bounded by config.
- Average confidence is calculated correctly.
- Confidence band uses central threshold config.
- UI works on desktop and tablet widths.
- No questionnaire wording is hard-coded in multiple components.

## What not to build

- Do not add long clinical questionnaires that slow the MVP.
- Do not build diagnosis logic.
- Do not create caregiver or clinician questionnaire portals.
- Do not replace the four-domain framework without Shaun approval.
