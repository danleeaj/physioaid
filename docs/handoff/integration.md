# Integration Plan and Module Contracts

## Integration principle

Each person owns a module. Nobody owns the whole product alone. The team owns the demo.

All modules must integrate through simple typed contracts.

## Timeline

### Monday night — Review and status alignment

Goals:
- confirm Shaun's latest clinical wording
- confirm each module's status
- freeze MVP scope
- decide demo fallback data
- identify integration blockers

Outputs:
- final questionnaire wording or placeholders
- chair stand metric schema
- motion metric schema
- analytics threshold config
- dashboard content
- demo persona and fixture

### Tuesday — Integration

Goals:
- merge frontend flow
- connect questionnaire
- connect chair stand
- connect motion
- run analytics
- show dashboard/report
- test fallback paths

Outputs:
- working end-to-end demo
- one fixture for Mr Tan
- report export/share
- QA checklist

### Wednesday — Final submission

Goals:
- polish UI
- rehearse pitch
- freeze code
- record backup demo if possible
- prepare Q&A

## Shared interfaces

### Safety screen

```ts
type SafetyScreenResult = {
  dizziness: boolean;
  breathlessness: boolean;
  pain: boolean;
  recentFallOrInjury: boolean;
  needsSupervision: boolean;
  canProceed: boolean;
  notes?: string;
};
```

Rule:
- if `canProceed` is false, movement testing is blocked or changed to demo mode.

### Questionnaire

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

Rule:
- questionnaire agent owns score calculation
- analytics agent consumes the result

### Chair stand

```ts
type ChairStandMetrics = {
  completed: boolean;
  repetitions: number;
  durationSeconds: number;
  usedArmSupport?: boolean;
  stoppedEarly?: boolean;
  qualityFlags: string[];
  source: "camera" | "manual" | "demo";
};
```

Rule:
- computer vision agent produces this object
- frontend can pass manual/demo fallback

### Motion

```ts
type MotionMetrics = {
  available: boolean;
  sampleCount: number;
  stabilityIndex?: number;
  rhythmConsistency?: number;
  peakAcceleration?: number;
  source: "device_motion" | "manual" | "demo" | "unavailable";
};
```

Rule:
- motion agent produces this object
- analytics must not fail if unavailable

### Analytics

```ts
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

Rule:
- analytics agent produces this object
- report and dashboard consume it
- use rule-based logic only for MVP

## Module owners

| Module | Owner |
|---|---|
| Clinical content | Shaun |
| App flow / UX / integration | Wayne |
| Motion sensor / accelerometer | Daniel |
| Computer vision / chair stand | Ezekiel |
| Analytics rules | shared, Shaun reviews clinical interpretation |
| Report and dashboard | Wayne + frontend agent |
| QA and demo | whole team |

## Integration checklist

- [ ] all modules import shared types
- [ ] questionnaire returns `FallsEfficacyResult`
- [ ] chair stand returns `ChairStandMetrics`
- [ ] motion returns `MotionMetrics` or unavailable fallback
- [ ] analytics handles missing sensor/CV data
- [ ] safety screen can block movement assessment
- [ ] dashboard renders every profile type
- [ ] report includes disclaimer
- [ ] demo fixture works offline
- [ ] no UI text says diagnosis or prescription
- [ ] care linkage appears on final screen

## Merge discipline

Agents should not edit each other's owned files without explicit coordination.

Before merging:
- run typecheck
- run unit tests if present
- manually complete demo flow
- screenshot dashboard
- verify copy against `CONSTITUTION.md`

## Demo fallback rule

A hackathon demo must not depend on perfect sensor conditions. Always include:
- demo fixture
- manual timing option
- unavailable sensor state
- report generated from fixture
