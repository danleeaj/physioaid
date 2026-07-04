# Clinical Framework

This document translates Shaun's brief into clinical implementation guidance for the hackathon MVP.

## Clinical stance

Physio-Aid is decision support and screening. It is not diagnosis, clinical validation, or a replacement for physiotherapy review.

## Clinical purpose

The platform supports earlier identification of:
- frailty-related vulnerability
- falls-related confidence issues
- functional decline
- ability–confidence mismatch
- need for community or physiotherapy support

## Clinical concepts

### Frailty

Frailty is presented as a trajectory of reduced reserve and vulnerability. The MVP should not diagnose frailty. It should identify possible functional concerns and suggest appropriate follow-up.

### Falls

Falls and near-falls are clinically meaningful. The app should ask about falls history and treat recent fall, pain, dizziness, or unsupervised movement risk as safety concerns.

### Falls efficacy

Falls efficacy captures confidence and perceived ability. For the MVP, use four domains:
1. Balance confidence
2. Balance recovery confidence
3. Safe-falling confidence
4. Post-fall recovery confidence

### Functional decline

Chair stand is the core MVP functional test. It represents a simple community-ready indicator of lower-limb functional ability. Gait speed and floor rising are optional extensions.

### Ability–confidence mismatch

The product exists to interpret the relationship between measured ability and perceived confidence.

| Ability | Confidence | Profile | Care meaning |
|---|---|---|---|
| Good | Low | Under-confidence | Confidence-building and graded exposure may be relevant |
| Poor | High | Possible risk-taking | Safety awareness and supervised support may be relevant |
| Poor | Low | High vulnerability | Higher support and care linkage may be relevant |
| Good | Good | Stable profile | Maintain activity and monitor periodically |

## Safety screening

Screen before movement testing:
- dizziness today
- unusual breathlessness
- chest pain or severe pain
- recent fall or injury
- feeling unsafe to stand
- needs supervision
- no stable chair or unsafe environment

If any high-risk answer is selected:
- pause or defer movement test
- advise support/supervision
- show care linkage
- do not show the result as a diagnosis

## Consent

Assessment consent must be required before data collection.

Research consent must be optional and separate.

Consent copy should say:
- what is collected
- why it is collected
- that the tool is decision support
- that movement testing should only proceed if safe
- that research participation is optional

## Emergency contact

Emergency contact must be collected before movement testing.

Fields:
- name
- relationship
- phone number

Explain that the contact is collected for safety escalation or support if the user feels unwell or needs help.

## Demographic fields

MVP fields:
- age
- gender
- height
- weight
- walking aid use
- falls history
- activity level

Avoid collecting unnecessary identifiers for MVP.

## Falls efficacy questionnaire

Implementation rule:
- keep wording in config
- use four questions
- use a simple numeric confidence scale
- allow Shaun to edit the exact wording and scoring

Suggested MVP scale:
- 0 = not confident at all
- 10 = very confident

Suggested placeholder questions:
1. How confident are you that you can keep your balance during everyday walking or standing tasks?
2. How confident are you that you can recover your balance if you feel unsteady?
3. How confident are you that you know how to protect yourself if you start to fall?
4. How confident are you that you can get help or recover safely after a fall?

These are placeholder implementation questions for the prototype. Shaun should review final wording.

## Chair stand assessment

MVP instructions:
- use a stable chair against a wall if possible
- clear surrounding space
- wear appropriate footwear
- have support nearby if needed
- stop immediately if dizzy, breathless, in pain, or unsafe

Capture:
- completion status
- time
- repetitions
- stopped early
- use of arms if observed or self-reported
- quality flags

## Rule-based clinical interpretation

Rule-based analytics must be labelled provisional for the hackathon.

Example bands:
- confidence band: low if average confidence is below configured threshold
- ability band: good/reduced/poor based on chair stand duration, completion, and quality flags
- risk category: low/moderate/high based on profile plus safety and fall history modifiers

No threshold should be presented as validated unless Shaun confirms.

## Recommendations

Use care recommendation language. Do not prescribe.

Recommendation categories:
- maintain activity
- confidence-building practice
- balance recovery training
- strengthening practice
- caregiver-supported or supervised practice
- Active Ageing Centre linkage
- Community Health Post linkage
- Physiotherapy Clinic review
- seek urgent help if currently unwell or injured

## Report wording

Every report must include:
> This report is generated by Physio-Aid as a decision-support summary. It is not a diagnosis and does not replace assessment by a qualified healthcare professional.

## Clinical review checklist for Shaun

Before final demo, Shaun should review:
- safety screening wording
- consent wording
- four falls efficacy questions
- chair stand instructions
- profile interpretations
- recommendation text
- dashboard wording
- report disclaimer
- pitch claims
