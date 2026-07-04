# Roadmap

## Hackathon MVP

Build one polished patient-first pathway:
- landing page
- safety screening and consent
- emergency contact setup
- demographics
- four-domain falls efficacy questionnaire
- chair stand assessment
- smartphone accelerometer input
- computer vision or sensor analytics
- rule-based ability–confidence engine
- dashboard
- report export/share
- care linkage

Do not block this with optional features.

## Near-term extensions

### Better chair stand analysis

- improved rep detection
- posture/movement quality flags
- stability proxy
- arm-support detection
- repeated assessments over time

### Gait speed

Optional functional test extension. Add only after chair stand works.

### Floor rising

Optional extension with higher safety requirements. Must not be included without stronger safety guidance and Shaun review.

### Report sharing

- shareable link
- printable PDF
- caregiver-friendly summary
- clinician-friendly summary

Reports should come before full separate portals.

### Care worker mode

A guided mode for Active Ageing Centres or community care workers to assist older adults.

## Mid-term extensions

### Caregiver view

Keep limited:
- view report
- see recommendations
- receive suggested next steps
- no complex portal at first

### Therapist view

Keep focused:
- review assessment summary
- compare repeat assessments
- add notes
- recommend follow-up

### Trend monitoring

- repeat chair stand over time
- confidence change over time
- ability–confidence profile changes
- alerts for deterioration

## Research roadmap

Only with explicit optional consent:
- anonymised derived movement metrics
- Singapore mobility benchmark dataset
- subgroup reference ranges
- longitudinal frailty/falls transition research
- model development dataset

## Machine learning roadmap

Machine learning is future work, not required for MVP.

Possible future ML use:
- movement quality classification
- risk prediction
- pattern discovery
- personalised recommendation ranking
- benchmark comparison

Do not claim ML clinical performance during hackathon.

## Clinical validation roadmap

Before deployment claims:
1. clinician review of questionnaire and safety workflow
2. usability testing with older adults and care workers
3. supervised pilot
4. comparison against clinical measures
5. reliability testing for sensors and camera metrics
6. outcomes study if claiming impact

## Product maturity stages

| Stage | Description |
|---|---|
| Prototype | Hackathon demo, rule-based, no validation claims |
| Supervised pilot | Community or clinic trial with clinician oversight |
| Workflow pilot | Active Ageing Centre or clinic operational fit |
| Validation study | Clinical and technical performance evaluation |
| Production | Privacy, security, governance, monitoring, support |

## Keep out of MVP

- full EHR integration
- national directory integration
- native mobile rebuild
- caregiver social network
- doctor dashboard
- automated emergency calling
- production ML claims
- raw video database
