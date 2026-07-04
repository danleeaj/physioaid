# Frontend Agent

## Goal

Build the patient-first web app flow with older-adult-friendly design and integrate questionnaire, chair stand, motion, analytics, dashboard, report, and care linkage modules.

## Context from Shaun’s brief

Physio-Aid is a web-based physiotherapy support platform focused on prolonging healthspan by preventing frailty progression and falls in older adults. The brief centres the MVP on safety screening, falls efficacy, chair stand assessment, sensor/CV analytics, an ability–confidence profile, risk stratification, recommendations, and linkage to Active Ageing Centres, Community Health Posts, or Physiotherapy Clinics. The tool is decision support, not diagnosis. The brief specifies a web app architecture and a guided patient workflow. The MVP should be patient-first and should not overbuild caregiver or doctor dashboards.

## Responsibilities

- Implement landing page and assessment wizard.
- Use large typography, high contrast, and clear progress.
- Integrate safety, consent, emergency contact, demographics, questionnaire, chair stand, motion, analytics, dashboard, and report.
- Provide graceful fallbacks for camera and motion failure.
- Keep UX calm and clinical.
- Make the hero screen the Ability–Confidence Dashboard.

## Inputs

- Clinical copy config
- Questionnaire component
- Chair stand component
- Motion sensor status
- Analytics result
- Report model

## Outputs

- Complete patient assessment flow
- Dashboard page
- Report route
- Progress state
- Demo fixture entry point

## Files it owns

- `src/app/page.tsx`
- `src/app/assessment/page.tsx`
- `src/components/assessment/**` integration components
- `src/components/layout/**`
- `src/components/dashboard/**` composition layer
- `src/styles/**` or Tailwind config
- `tests/e2e/assessment-flow.spec.ts`

## Files it must not edit

- `src/lib/sensors/**` internal algorithms
- `src/lib/vision/**` internal algorithms
- `src/lib/analytics/**` internal rules
- `src/content/recommendations.ts` unless copy-only coordinated
- `src/server/storage/**`

## Integration contract

The frontend owns orchestration of step state:

```ts
type AssessmentStep =
  | "landing"
  | "safety"
  | "emergency_contact"
  | "demographics"
  | "questionnaire"
  | "chair_stand"
  | "analytics"
  | "dashboard"
  | "report";
```

It passes typed module outputs into `AssessmentSession` and calls `analyseAssessment()` only when required inputs are available.

## Acceptance criteria

- A user can complete the flow end to end.
- Safety screening comes before movement testing.
- Emergency contact comes before movement testing.
- The dashboard is clear and readable.
- The flow remains usable without camera/motion permissions.
- No full caregiver/doctor dashboard is built.
- All copy follows decision-support language.

## What not to build

- Do not make a native mobile app first.
- Do not create complex login/account flows.
- Do not overbuild portals.
- Do not bury the ability–confidence profile.
- Do not use small text or dense UI.
