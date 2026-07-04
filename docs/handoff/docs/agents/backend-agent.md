# Backend Agent

## Goal

Create minimal API and storage support for assessment sessions while preserving PDPA-aware data minimisation and derived-metric storage.

## Context from Shaun’s brief

Physio-Aid is a web-based physiotherapy support platform focused on prolonging healthspan by preventing frailty progression and falls in older adults. The brief centres the MVP on safety screening, falls efficacy, chair stand assessment, sensor/CV analytics, an ability–confidence profile, risk stratification, recommendations, and linkage to Active Ageing Centres, Community Health Posts, or Physiotherapy Clinics. The tool is decision support, not diagnosis. The brief emphasises privacy, consent, emergency contact, and storing derived movement metrics where possible instead of raw video. Backend work is optional/minimal for MVP and must not block the demo.

## Responsibilities

- Define assessment session persistence if needed.
- Store consent, emergency contact, demographics, questionnaire results, derived metrics, analytics, and report summary.
- Separate assessment consent from optional research consent.
- Avoid raw video storage by default.
- Provide local-only fallback if backend is not ready.
- Document data retention assumptions.

## Inputs

- `AssessmentSession` objects
- Consent records
- Derived chair stand and motion metrics
- Analytics and report summaries

## Outputs

- API routes or storage adapters
- Data schema
- Local/demo storage fallback
- Privacy notes

## Files it owns

- `src/server/api/**`
- `src/server/storage/**`
- `src/lib/privacy/**`
- `src/types/assessment.ts`
- `src/types/storage.ts`
- `tests/unit/storage.test.ts`

## Files it must not edit

- `src/lib/analytics/**`
- `src/lib/sensors/**`
- `src/lib/vision/**`
- `src/components/**` except API integration wrappers
- `src/content/**`

## Integration contract

If backend exists, expose minimal operations:

```ts
createAssessmentSession(input: Partial<AssessmentSession>): Promise<{ id: string }>;
updateAssessmentSession(id: string, patch: Partial<AssessmentSession>): Promise<AssessmentSession>;
getAssessmentReport(id: string): Promise<ReportSummary>;
deleteAssessmentSession(id: string): Promise<void>;
```

All storage must use derived metrics by default. Raw media storage requires explicit separate consent and should not be in MVP.

## Acceptance criteria

- The app can run without backend using local/demo storage.
- Assessment consent and research consent are separate.
- Emergency contact is not included in anonymised research exports.
- No raw video storage is created by default.
- Stored fields are minimal and documented.
- APIs return typed assessment/report objects.

## What not to build

- Do not build a complex authentication system unless already available.
- Do not add raw video uploads by default.
- Do not create production compliance claims.
- Do not block frontend demo on backend persistence.
- Do not combine identifiable data with research exports.
