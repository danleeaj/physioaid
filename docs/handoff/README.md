# Physio-Aid / Physi-ad

Physio-Aid is a hackathon MVP for a web-based physiotherapy support platform. It helps older adults, caregivers, community care workers, and physiotherapy teams identify early functional decline and falls-related confidence issues before they become a crisis.

The platform is not a diagnosis tool. It is a decision-support and screening workflow that translates simple assessment inputs into a clear ability–confidence profile, risk category, practical care recommendations, and community care linkage.

## Core concept

Frailty and falls are connected healthspan problems. An older adult may have good physical ability but low confidence, leading to fear of movement and avoidance. Another person may have poor ability but high confidence, suggesting possible risk-taking or reduced insight. Physio-Aid interprets this mismatch.

## MVP flow

1. Landing page
2. Safety screening and consent
3. Emergency contact setup
4. Demographic information
5. Falls efficacy questionnaire
6. Chair stand assessment
7. Smartphone accelerometer / motion sensor input
8. Computer vision / sensor analytics
9. Ability–confidence analytics engine
10. Risk stratification
11. Dashboard + report + recommendations
12. Care linkage to Active Ageing Centre, Community Health Post, or Physiotherapy Clinic

## Recommended technical stack

Use a web app first.

Suggested hackathon stack:
- Next.js or Vite React
- TypeScript
- Tailwind CSS or simple CSS modules
- Browser camera APIs
- Browser DeviceMotion / DeviceOrientation APIs where supported
- Local state or lightweight backend for MVP
- Optional backend: Supabase, SQLite, or simple API routes
- Report export: printable HTML first, PDF later

The MVP must work even if advanced sensor permissions fail. Provide graceful fallback fields for manual timing or demo-mode metrics.

## Primary user

The primary user is an older adult completing a guided assessment, either at home with support or in a community setting such as an Active Ageing Centre. Do not start by building a full caregiver portal or doctor dashboard. Reports can be exported or shared.

## Demo persona

Use one consistent persona:

Mr Tan is 78 years old and lives independently in the community. His daughter notices that he is slower when standing up from a chair and less confident walking outside. Mr Tan wants to remain independent and understand whether he should maintain, monitor, seek community support, or escalate to physiotherapy review.

## Ability–confidence profiles

| Objective ability | Confidence | Profile | Interpretation |
|---|---:|---|---|
| Good | Low | Under-confidence | Avoidance, fear of movement, reduced participation |
| Poor | High | Possible risk-taking | Reduced insight or mismatch between capacity and perceived ability |
| Poor | Low | High vulnerability | Functional limitation plus low confidence |
| Good | Good | Stable profile | Maintain activity and monitor periodically |

## MVP analytics

Use rule-based analytics for the hackathon.

Inputs:
- demographic context
- falls history
- walking aid use
- four falls efficacy confidence items
- chair stand completion time
- chair stand repetition count or quality
- optional accelerometer stability indicators
- optional computer vision movement quality indicators

Outputs:
- ability band: good / reduced / poor
- confidence band: good / low
- ability–confidence profile
- risk category: low / moderate / high functional-falls risk
- recommendations
- care linkage

All thresholds are hackathon placeholders until Shaun reviews them.

## Safety and privacy principles

- Consent before assessment
- Emergency contact before movement testing
- Screen for dizziness, breathlessness, pain, recent fall, and supervision needs
- Stop or defer movement testing if safety screening fails
- Store derived movement metrics where possible instead of raw video
- Keep research participation optional and separate
- Use anonymised data for future Singapore mobility research only with explicit consent
- Use PDPA-aware data minimisation
- Avoid claims of clinical validation

## Key files in this pack

- `CONSTITUTION.md`: the clinical/product source of truth
- `CODEX_HANDOFF.md`: how to start coding
- `architecture.md`: system design and data flow
- `clinical.md`: clinical framework, safety, questionnaire, profiles
- `integration.md`: module contracts
- `docs/config.md`: centralised product/config model
- `docs/design.md`: older-adult-friendly UI direction
- `docs/orchestrator.md`: remote team workflow
- `docs/agents/*.md`: module-specific agent briefs
