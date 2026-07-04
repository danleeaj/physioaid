# Orchestrator Guide for Remote Build

This document coordinates team and agent work.

## Principle

Nobody owns the whole product. Each person owns a module. The team owns the demo.

## Role map

| Person / agent | Ownership |
|---|---|
| Shaun | Clinical framework, safety, questionnaire, recommendations, literature, final clinical review |
| Wayne | App flow, UX, rough UI, integration, repo coordination |
| Daniel | Motion sensor / accelerometer module |
| Ezekiel | Computer vision / chair stand module |
| Clinical agent | Clinical copy and rules implementation support |
| Questionnaire agent | Falls efficacy UI/scoring |
| Motion agent | Accelerometer capture and summarisation |
| Computer vision agent | Chair stand capture and metrics |
| Analytics agent | Ability–confidence rule engine |
| Report agent | Dashboard/report/export |
| Frontend agent | Patient app flow |
| Backend agent | Storage/API/data minimisation |
| Research agent | Literature and claims discipline |
| QA agent | End-to-end test, accessibility, copy checks |

## Daily workflow

### Monday night

Review:
- what each module has working
- what contracts changed
- what clinical wording needs Shaun review
- what is at risk

Freeze:
- demo persona
- assessment flow
- chair stand metrics schema
- confidence score schema
- ability–confidence outputs
- report layout

### Tuesday

Integrate:
- UI flow
- questionnaire
- CV
- motion
- analytics
- dashboard/report

Use demo data when hardware integration is unstable.

### Wednesday

Polish:
- visual design
- pitch
- Q&A
- backup recording
- final repo cleanup

## Agent instruction template

When asking an agent to work, include:
- read `CONSTITUTION.md` first
- read relevant agent doc
- state files it may edit
- state files it must not edit
- state expected input/output contract
- require decision-support language
- require graceful fallback

## Merge gates

Before merging any module:
- typecheck passes
- no hard-coded diagnosis language
- no raw video storage by default
- no broken assessment flow
- dashboard still renders
- report disclaimer still appears
- demo fixture still works

## Blocker escalation

Escalate to Shaun:
- clinical wording
- safety screen disputes
- questionnaire wording
- recommendation content
- interpretation of ability–confidence profiles
- claims about evidence or validation

Escalate to Wayne:
- UX flow conflicts
- integration breakage
- repo structure
- final demo sequencing

Escalate to Daniel:
- accelerometer permissions
- motion capture metrics
- device support

Escalate to Ezekiel:
- chair stand CV detection
- camera capture
- rep/timing metrics

## Scope control

If time is short, cut:
1. caregiver dashboard
2. therapist dashboard
3. gait speed
4. floor rising
5. ML
6. backend persistence
7. polished PDF export

Never cut:
1. safety screening
2. emergency contact
3. falls efficacy questionnaire
4. chair stand path or demo fallback
5. ability–confidence dashboard
6. decision-support language
