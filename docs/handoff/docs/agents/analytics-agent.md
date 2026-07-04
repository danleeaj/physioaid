# Analytics Agent

## Goal

Build the rule-based ability–confidence analytics engine that combines movement ability and falls efficacy confidence into profile, risk category, interpretation, and recommendations.

## Context from Shaun’s brief

Physio-Aid is a web-based physiotherapy support platform focused on prolonging healthspan by preventing frailty progression and falls in older adults. The brief centres the MVP on safety screening, falls efficacy, chair stand assessment, sensor/CV analytics, an ability–confidence profile, risk stratification, recommendations, and linkage to Active Ageing Centres, Community Health Posts, or Physiotherapy Clinics. The tool is decision support, not diagnosis. The brief states that the innovation is interpreting the gap between ability and confidence. The MVP should use rule-based analytics; future machine learning belongs in the roadmap, not core implementation.

## Responsibilities

- Calculate ability band from chair stand and optional motion/CV metrics.
- Consume confidence band from questionnaire module.
- Assign one of four ability–confidence profiles.
- Assign low/moderate/high functional-falls risk category.
- Apply safety and falls-history modifiers.
- Return explanation, recommendations, and care linkage.
- Keep thresholds configurable and labelled provisional.

## Inputs

- `SafetyScreenResult`
- `Demographics`
- `FallsEfficacyResult`
- `ChairStandMetrics`
- `MotionMetrics` optional
- `VisionMetrics` optional
- Threshold config
- Recommendation config

## Outputs

- `AbilityConfidenceResult`
- Ability band
- Confidence band
- Profile interpretation
- Risk category
- Recommendations
- Care linkage

## Files it owns

- `src/lib/analytics/ability-confidence.ts`
- `src/lib/analytics/risk-rules.ts`
- `src/lib/analytics/recommendation-selector.ts`
- `src/config/thresholds.ts`
- `src/types/analytics.ts`
- `tests/unit/ability-confidence.test.ts`

## Files it must not edit

- `src/lib/sensors/**`
- `src/lib/vision/**`
- `src/components/assessment/**` unless adding type-safe integration only
- `src/server/storage/**`
- Clinical copy except via config imports

## Integration contract

The analytics agent exports:

```ts
function analyseAssessment(input: {
  safety: SafetyScreenResult;
  demographics: Demographics;
  questionnaire: FallsEfficacyResult;
  chairStand: ChairStandMetrics;
  motion?: MotionMetrics;
  vision?: VisionMetrics;
}): AbilityConfidenceResult;
```

The function must never throw because optional sensor or camera metrics are missing. It should degrade gracefully.

## Acceptance criteria

- All four ability–confidence profiles can be produced in tests.
- Risk categories can be low, moderate, or high.
- Missing motion/CV data does not break analysis.
- Safety concerns can raise risk or block movement assessment output.
- Output uses decision-support wording.
- Thresholds live in config and are marked provisional.

## What not to build

- Do not build production machine learning.
- Do not output a generic AI risk score.
- Do not diagnose frailty or fall risk.
- Do not prescribe treatment.
- Do not hard-code clinical wording across many files.
