# Physio-Aid Clinical and Product Constitution

This document defines the non-negotiable clinical and product direction for Physio-Aid / Physi-ad.

## Constitutional rule

The uploaded Shaun brief is the source of truth. If anything else conflicts with the brief, the brief wins.

## Project identity

Physio-Aid is a web-based physiotherapy support platform focused on prolonging healthspan by preventing frailty progression and falls in older adults.

It is a decision-support and screening platform, not a diagnostic system and not a replacement for clinicians.

## Problem

Frailty and falls are major, interlinked ageing challenges. The brief states that Singapore data suggest approximately 6.2% of older adults are frail and 37.0% are pre-frail. Falls affect about one in three older adults, and fall risk approximately doubles among those aged 80 years and above.

Falls are not isolated accidents. They can be sentinel events in the frailty life-course, marking transition from early vulnerability to disability, reduced confidence, loss of participation, hospitalisation, caregiver burden, and long-term care needs.

The economic burden is substantial. The brief states that older adults with Clinical Frailty Scale scores of 5 and 6–7 have been reported to incur 61% to 272% higher costs than those with CFS 4.

## Clinical aim

Physio-Aid shifts care upstream by supporting earlier detection of:
- functional decline
- falls-related confidence issues
- frailty-related vulnerability
- ability–confidence mismatch
- need for community or physiotherapy follow-up

The aim is to preserve mobility, confidence, independence, participation, and healthspan.

## Key innovation

Most tools track movement, deliver exercises, or collect questionnaires. Physio-Aid brings these together into one structured care workflow.

The central innovation is the ability–confidence profile:

> Our innovation is not just detecting movement. It is interpreting the gap between what an older adult can do and what they believe they can do.

## Ability–confidence profile

| Pattern | Clinical meaning |
|---|---|
| Good ability + low confidence | Under-confidence, avoidance, fear of movement |
| Poor ability + high confidence | Possible risk-taking or reduced insight |
| Poor ability + low confidence | High vulnerability |
| Good ability + good confidence | Stable profile |

## MVP clinical workflow

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

## Core clinical domains

### Frailty

Frailty is treated as a trajectory of functional vulnerability, not just a late-stage diagnosis. Physio-Aid looks for early functional signals that may be actionable before disability becomes established.

### Falls

Falls and near-falls are treated as clinically actionable sentinel events. The MVP must ask about fall history and use safety screening before movement testing.

### Falls efficacy

Falls efficacy is treated as a confidence-related construct relevant to rehabilitation and behaviour. The MVP captures four domains:
- balance confidence
- balance recovery confidence
- safe-falling confidence
- post-fall recovery confidence

### Functional decline

The MVP uses chair stand as the core functional movement assessment. Gait speed and floor rising are optional extensions only.

### Healthspan

The product narrative is not just injury prevention. It is healthspan extension through safer mobility, greater confidence, sustained independence, and better active ageing outcomes.

## MVP functional assessment

Chair stand is the core MVP functional test.

The MVP should capture:
- completion status
- time to complete
- repetition count
- optional movement quality indicators
- optional accelerometer stability indicators
- whether the test was stopped or unsafe

The MVP must include a manual/demo fallback if camera or motion sensors fail.

## Decision-support boundaries

Physio-Aid may:
- screen for potential functional-falls risk
- describe ability–confidence mismatch
- suggest care recommendations
- suggest community or physiotherapy linkage
- create a shareable report

Physio-Aid must not:
- diagnose frailty
- diagnose fall risk as a medical condition
- prescribe medical treatment
- claim clinical validation
- replace physiotherapy assessment
- encourage unsafe unsupervised exercise
- store unnecessary raw video by default

## Safety requirements

Before movement testing:
- obtain consent
- collect emergency contact
- screen for dizziness, breathlessness, pain, recent fall, and supervision needs
- warn the user to use a stable chair and clear surrounding area
- ask whether supervision is needed

If screening indicates concern:
- do not proceed as normal
- show a safety-first message
- recommend support from a caregiver, care worker, Active Ageing Centre, Community Health Post, or Physiotherapy Clinic
- allow demo-mode only if clearly marked as demo data

## Privacy and PDPA-aware requirements

- Collect minimal personal data
- Separate consent for assessment and optional research use
- Avoid storing raw video unless explicitly necessary and consented
- Store derived movement metrics where possible
- Treat emergency contact details as sensitive personal data
- Use anonymised data for future Singapore mobility research only with explicit consent
- Avoid unnecessary account creation for hackathon MVP
- Provide delete/export language if storage is implemented

## Team roles

- Shaun: Clinical Product Owner and final clinical reviewer. Owns clinical framework, falls efficacy, questionnaire, safety, recommendations, literature, and clinical review. Shaun does not need to operate Codex directly.
- Wayne: App flow, UX, rough UI, integration, and repo coordination. Wayne is not the sole project manager.
- Daniel: Motion sensor / accelerometer module.
- Ezekiel: Computer vision / chair stand module.
- Whole team: demo and submission quality.

## Build constraints

Keep scope tight:
- web app first
- patient-first flow
- one polished journey
- chair stand core
- reports/export instead of full separate dashboards
- rule-based analytics now
- machine learning later
- no overbuilt portals

## Judging message

Physio-Aid is clinically relevant, technically feasible, privacy-aware, and community-ready. It turns a few minutes of guided assessment into a practical ability–confidence profile, risk stratification, care recommendations, and linkage to community or physiotherapy support.

## References from the brief

The brief references literature on Singapore frailty prevalence, falls and frailty transitions, societal cost of frailty in Singapore, falls efficacy, sitting-rising/floor rising, screening tests, gait speed, and sit-to-stand reference ranges. Use these as support for pitch and clinical rationale, but do not claim that the MVP is clinically validated.
