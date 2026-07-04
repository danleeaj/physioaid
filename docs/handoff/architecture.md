# Architecture

## Architecture principle

Build a practical, scalable web app around one polished patient-first journey.

Do not overbuild native mobile features, full portals, hospital integrations, or production machine learning for the hackathon MVP.

## High-level flow

```txt
Patient Web App
  ↓
Safety Screening and Consent
  ↓
Emergency Contact Setup
  ↓
Demographic Information
  ↓
Falls Efficacy Questionnaire
  ↓
Chair Stand Assessment
  ↓
Smartphone Accelerometer / Motion Sensor Input
  ↓
Computer Vision / Sensor Analytics
  ↓
Ability–Confidence Analytics Engine
  ↓
Risk Stratification
  ↓
Dashboard + Report + Recommendations
  ↓
Care Linkage
```

## System modules

### Frontend flow

Responsibilities:
- landing page
- guided assessment
- progress indicator
- older-adult-friendly UI
- camera permission and preview
- motion permission prompt
- dashboard and report display

### Clinical content module

Responsibilities:
- safety copy
- consent copy
- questionnaire wording
- recommendation wording
- disclaimer copy
- care linkage copy

All clinical copy must remain editable for Shaun review.

### Questionnaire module

Responsibilities:
- four falls efficacy questions
- scoring
- confidence band generation
- input validation

Domains:
- balance confidence
- balance recovery confidence
- safe-falling confidence
- post-fall recovery confidence

### Motion sensor module

Responsibilities:
- request device motion permissions where available
- capture acceleration samples during chair stand
- summarise derived movement features
- gracefully handle unsupported browsers

Derived examples:
- duration
- movement intensity
- rhythm consistency
- stability proxy
- sample count
- sensor availability

### Computer vision module

Responsibilities:
- browser camera capture
- chair stand timing and repetition detection where possible
- quality flags
- manual/demo fallback
- derived metric output

The MVP should store derived metrics, not raw video, unless explicit consent and technical need exist.

### Analytics module

Responsibilities:
- rule-based ability band
- rule-based confidence band
- ability–confidence profile
- risk category
- recommendation selection
- explanation strings

No production ML is required.

### Report module

Responsibilities:
- create a report summary
- provide share/export/print
- display disclaimers
- include care linkage

Reports can replace separate caregiver/doctor dashboards in MVP.

### Backend/storage module

MVP can be local-only or lightweight backend.

If backend is used:
- store only necessary session data
- separate assessment consent and research consent
- prefer derived metrics
- encrypt or protect contact data where possible
- allow export/delete language

## Data model

```ts
type ConsentRecord = {
  assessmentConsent: boolean;
  researchConsentOptional: boolean;
  consentedAt: string;
  version: string;
};

type EmergencyContact = {
  name: string;
  relationship: string;
  phone: string;
};

type Demographics = {
  age: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  walkingAidUse: "none" | "stick" | "walker" | "wheelchair" | "other";
  fallsHistory: "none" | "near_fall" | "one_fall" | "multiple_falls";
  activityLevel?: "low" | "moderate" | "active";
};

type SafetyScreenResult = {
  dizziness: boolean;
  breathlessness: boolean;
  pain: boolean;
  recentFallOrInjury: boolean;
  needsSupervision: boolean;
  canProceed: boolean;
  notes?: string;
};

type FallsEfficacyResult = {
  balanceConfidence: number;
  balanceRecoveryConfidence: number;
  safeFallingConfidence: number;
  postFallRecoveryConfidence: number;
  averageConfidence: number;
  confidenceBand: "good" | "low";
};

type ChairStandMetrics = {
  completed: boolean;
  repetitions: number;
  durationSeconds: number;
  usedArmSupport?: boolean;
  stoppedEarly?: boolean;
  qualityFlags: string[];
  source: "camera" | "manual" | "demo";
};

type MotionMetrics = {
  available: boolean;
  sampleCount: number;
  stabilityIndex?: number;
  rhythmConsistency?: number;
  peakAcceleration?: number;
  source: "device_motion" | "manual" | "demo" | "unavailable";
};

type VisionMetrics = {
  available: boolean;
  repetitionsDetected?: number;
  durationSeconds?: number;
  confidence?: number;
  qualityFlags: string[];
  source: "camera" | "manual" | "demo" | "unavailable";
};

type AbilityConfidenceResult = {
  abilityBand: "good" | "reduced" | "poor";
  confidenceBand: "good" | "low";
  profile:
    | "stable_profile"
    | "under_confidence"
    | "possible_risk_taking"
    | "high_vulnerability";
  riskCategory: "low" | "moderate" | "high";
  interpretation: string;
  recommendations: Recommendation[];
  careLinkage: CareLinkage[];
};
```

## API boundaries

For MVP, modules may communicate in memory. If API routes are used:

- `POST /api/assessment/session`
- `PATCH /api/assessment/:id/safety`
- `PATCH /api/assessment/:id/demographics`
- `PATCH /api/assessment/:id/questionnaire`
- `PATCH /api/assessment/:id/chair-stand`
- `PATCH /api/assessment/:id/motion`
- `POST /api/assessment/:id/analyse`
- `GET /api/assessment/:id/report`

## Security and privacy

Minimum expectations:
- no raw video storage by default
- explicit consent before any assessment
- separate optional research consent
- emergency contact before movement test
- derived movement metrics preferred
- avoid unnecessary personal data
- use decision-support wording
- anonymise any future research dataset

## Reliability

The demo must work without perfect browser permissions:
- camera denied → demo/manual chair stand metrics
- motion denied → manual/demo motion metrics
- backend down → local state
- export unavailable → printable report page
