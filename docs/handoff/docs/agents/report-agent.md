# Report Agent

## Goal

Build the dashboard and shareable report that communicates ability, confidence, profile interpretation, risk category, care recommendations, and care linkage.

## Context from Shaun’s brief

Physio-Aid is a web-based physiotherapy support platform focused on prolonging healthspan by preventing frailty progression and falls in older adults. The brief centres the MVP on safety screening, falls efficacy, chair stand assessment, sensor/CV analytics, an ability–confidence profile, risk stratification, recommendations, and linkage to Active Ageing Centres, Community Health Posts, or Physiotherapy Clinics. The tool is decision support, not diagnosis. The brief says the platform should generate a dashboard, report, recommendations, and care linkage. Reports can be shared/exported instead of building full separate caregiver or doctor portals.

## Responsibilities

- Create Ability–Confidence Dashboard as the hero screen.
- Render ability, confidence, profile, risk, recommendations, and care linkage.
- Generate a shareable/printable report summary.
- Include decision-support disclaimer.
- Avoid diagnosis or prescription language.
- Support demo fixture report generation.

## Inputs

- `AssessmentSession`
- `AbilityConfidenceResult`
- Clinical copy
- Recommendation config
- Care linkage config

## Outputs

- Dashboard UI model
- Report summary model
- Printable/exportable report page
- Shareable text or PDF-ready layout

## Files it owns

- `src/components/dashboard/AbilityConfidenceDashboard.tsx`
- `src/components/report/ReportSummary.tsx`
- `src/lib/report/report-model.ts`
- `src/lib/report/report-export.ts`
- `src/app/report/[id]/page.tsx`
- `tests/unit/report-model.test.ts`

## Files it must not edit

- `src/lib/sensors/**`
- `src/lib/vision/**`
- `src/lib/analytics/**` except consuming output types
- `src/components/assessment/**`
- Questionnaire scoring logic

## Integration contract

The report agent consumes:

```ts
type ReportInput = {
  session: AssessmentSession;
  analytics: AbilityConfidenceResult;
};
```

It returns:

```ts
type ReportSummary = {
  title: string;
  assessmentDate: string;
  ability: string;
  confidence: string;
  profile: string;
  riskCategory: string;
  recommendations: Recommendation[];
  careLinkage: CareLinkage[];
  disclaimer: string;
};
```

The dashboard and printable report should use the same model.

## Acceptance criteria

- Dashboard clearly shows ability–confidence profile, not generic score.
- Report includes assessment date, movement results, confidence summary, risk category, recommendations, and care linkage.
- Report includes decision-support disclaimer.
- Report works from demo fixture.
- Export/share path exists even if only printable HTML.
- No full caregiver or doctor portal is required.

## What not to build

- Do not build complex role-based portals for MVP.
- Do not present report as medical diagnosis.
- Do not overstate clinical validation.
- Do not require backend storage for report display.
- Do not hide care linkage.
