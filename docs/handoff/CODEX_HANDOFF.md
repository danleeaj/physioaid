# Codex Handoff — Build Instructions

This file is written for Codex, Claude Code, or a developer-agent starting a fresh implementation.

## First instruction

Read these files before writing code:
1. `CONSTITUTION.md`
2. `README.md`
3. `architecture.md`
4. `clinical.md`
5. `integration.md`
6. `docs/config.md`
7. `docs/design.md`
8. `docs/orchestrator.md`

Then read the agent brief for the module you are implementing.

## Product guardrail

This is not a generic AI fall prevention app. Build a web-based physiotherapy support platform centered on the ability–confidence profile.

## Recommended repo shape

If starting a new Next.js / TypeScript app, use:

```txt
src/
  app/
    page.tsx
    assessment/
      page.tsx
    report/
      [id]/
        page.tsx
  components/
    layout/
    assessment/
    dashboard/
    report/
  content/
    clinical-copy.ts
    recommendations.ts
  config/
    clinical-config.ts
    thresholds.ts
  lib/
    assessment-flow.ts
    questionnaire.ts
    analytics/
      ability-confidence.ts
      risk-rules.ts
    sensors/
      accelerometer.ts
      motion-summary.ts
    vision/
      chair-stand.ts
      video-metrics.ts
    report/
      report-model.ts
      report-export.ts
    privacy/
      consent.ts
      data-minimisation.ts
  server/
    api/
    storage/
  types/
    assessment.ts
    analytics.ts
    report.ts
tests/
  e2e/
  unit/
docs/
```

If the existing repo has a different structure, adapt while preserving module ownership and integration contracts.

## Build sequence

### Phase 1 — Patient journey shell

Create:
- landing page
- progress indicator
- assessment route
- step navigation
- state model
- final dashboard route

The flow must match:
`Landing → Safety/Consent → Emergency Contact → Demographics → Falls Efficacy → Chair Stand → Motion/CV Capture → Analytics → Dashboard/Report/Care Linkage`.

### Phase 2 — Clinical forms

Create:
- safety screening
- consent checkbox
- emergency contact form
- demographic form
- four-domain falls efficacy questionnaire

Keep all wording configurable so Shaun can review without editing code internals.

### Phase 3 — Functional assessment

Create:
- chair stand instruction screen
- camera capture or demo-mode fallback
- accelerometer permission flow or manual metric fallback
- derived metrics object

Chair stand is mandatory. Gait speed and floor rising are optional extensions and should not block MVP.

### Phase 4 — Analytics

Create a rule-based ability–confidence engine:
- convert chair stand and motion metrics into ability band
- convert questionnaire into confidence band
- combine into ability–confidence profile
- assign low / moderate / high functional-falls risk
- produce explanation and recommendations

Do not call it a diagnosis.

### Phase 5 — Dashboard and report

Create the hero screen:
- ability summary
- confidence summary
- ability–confidence profile
- interpretation
- risk category
- care recommendations
- care linkage
- share/export report

Reports can be printable HTML or JSON/Markdown export for MVP.

### Phase 6 — QA and demo polish

Use one demo persona: Mr Tan, 78.

Add demo data and ensure the end-to-end story can be shown even if:
- camera permission is denied
- motion permission is denied
- network is unavailable
- backend is not ready

## Shared data contracts

Use these top-level TypeScript concepts.

```ts
type AbilityBand = "good" | "reduced" | "poor";
type ConfidenceBand = "good" | "low";
type RiskCategory = "low" | "moderate" | "high";

type AbilityConfidenceProfile =
  | "stable_profile"
  | "under_confidence"
  | "possible_risk_taking"
  | "high_vulnerability";

type AssessmentSession = {
  id: string;
  consent: ConsentRecord;
  emergencyContact: EmergencyContact;
  demographics: Demographics;
  safetyScreen: SafetyScreenResult;
  questionnaire: FallsEfficacyResult;
  chairStand: ChairStandMetrics;
  motion?: MotionMetrics;
  vision?: VisionMetrics;
  analytics?: AbilityConfidenceResult;
  report?: ReportSummary;
  createdAt: string;
};
```

## Acceptance criteria for the whole MVP

- A user can complete the full assessment without developer intervention.
- The app prevents or warns against movement testing when safety screening indicates risk.
- Emergency contact is captured before movement testing.
- The dashboard clearly shows the ability–confidence profile.
- Recommendations use care recommendation language, not prescription language.
- Care linkage includes Active Ageing Centre, Community Health Post, and Physiotherapy Clinic options.
- The report can be exported or shared.
- The codebase has graceful fallbacks for camera and sensor failure.
- No page claims diagnosis or clinical validation.
- The demo can be completed in under three minutes.

## What not to build

Do not build:
- a native mobile app first
- full caregiver portal
- full doctor dashboard
- hospital-grade EHR integration
- autonomous diagnosis
- medication or treatment prescription
- production ML model
- raw video storage pipeline as default
- multi-test assessment suite that delays chair stand MVP
- complex account system unless already available
