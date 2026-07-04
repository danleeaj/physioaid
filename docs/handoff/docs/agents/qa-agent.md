# QA Agent

## Goal

Verify that the MVP works end to end, follows the clinical constitution, and is safe, accessible, and demo-ready.

## Context from Shaun’s brief

Physio-Aid is a web-based physiotherapy support platform focused on prolonging healthspan by preventing frailty progression and falls in older adults. The brief centres the MVP on safety screening, falls efficacy, chair stand assessment, sensor/CV analytics, an ability–confidence profile, risk stratification, recommendations, and linkage to Active Ageing Centres, Community Health Posts, or Physiotherapy Clinics. The tool is decision support, not diagnosis. The demo should be simple, visual, clinically meaningful, and easy for judges to follow. It must show one complete preventive care pathway.

## Responsibilities

- Run end-to-end assessment flow testing.
- Test camera-denied and motion-denied fallbacks.
- Test all ability–confidence profiles.
- Check UI copy for forbidden language.
- Check accessibility basics for older adults.
- Verify report disclaimer and care linkage.
- Prepare final demo checklist.

## Inputs

- Running app
- Demo fixture
- Assessment flow
- Analytics test fixtures
- `CONSTITUTION.md`
- `docs/design.md`
- `integration.md`

## Outputs

- QA checklist
- Bug list
- Demo risk list
- Acceptance report
- Screenshots if useful

## Files it owns

- `tests/e2e/**`
- `tests/unit/**` for QA fixtures
- `docs/qa-checklist.md` if created later
- Non-invasive test utilities

## Files it must not edit

- Clinical wording source files unless fixing typo with approval
- `src/lib/analytics/**` rules unless adding tests only
- `src/lib/sensors/**` algorithms unless adding tests only
- `src/lib/vision/**` algorithms unless adding tests only
- Major UI redesign files during final freeze

## Integration contract

QA should validate these fixture cases:

```ts
type QaCase = {
  name: string;
  questionnaire: FallsEfficacyResult;
  chairStand: ChairStandMetrics;
  motion?: MotionMetrics;
  expectedProfile: AbilityConfidenceProfile;
  expectedRisk: RiskCategory;
};
```

QA must ensure the full patient flow renders from landing page to report.

## Acceptance criteria

- End-to-end flow completes in under three minutes using demo fixture.
- Safety screen blocks or warns before movement testing.
- Emergency contact is required before movement testing.
- Dashboard and report render for all four profiles.
- No page uses diagnosis or prescription language.
- Camera/motion denial does not break the demo.
- Text is readable and high contrast.
- Care linkage is visible on the final screen.

## What not to build

- Do not expand scope during QA.
- Do not rewrite clinical logic without Shaun review.
- Do not remove safety gates for demo convenience.
- Do not hide failing modules instead of using declared fallbacks.
- Do not approve UI with tiny text or unclear risk language.
