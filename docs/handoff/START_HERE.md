# START HERE — Physio-Aid / Physi-ad Codex Pack

This documentation pack is the working handoff for building the hackathon MVP. It is written for Codex, Claude Code, or any developer-agent starting from a fresh session.

## Source of truth

The uploaded `the brief.docx` is the clinical constitution of this project. All product, clinical, design, and technical decisions in this pack are derived from that brief.

If anything in the repo, chat history, or an agent suggestion conflicts with Shaun's brief, the brief wins.

Do **not** use the older generic “AI fall prevention app” framing. This project is a **web-based physiotherapy support platform** focused on prolonging healthspan by preventing frailty progression and falls in older adults.

## Product sentence

Physio-Aid is a web-based physiotherapy support platform that combines falls efficacy profiling, chair stand functional assessment, smartphone motion sensing, and computer vision to generate an **ability–confidence profile** and support community-ready care recommendations.

## Key innovation

> Our innovation is not just detecting movement. It is interpreting the gap between what an older adult can do and what they believe they can do.

## Non-negotiable language

Use:
- older adults
- healthspan
- frailty progression
- falls efficacy
- functional decline
- ability–confidence profile
- decision support
- care recommendations
- community-ready care pathway

Do not use:
- elderly, unless quoting source material
- AI risk score
- diagnosis
- medical prescription
- clinically validated, unless Shaun confirms evidence
- replacement for clinicians
- autonomous medical advice

## MVP patient journey

Landing page → Safety screening and consent → Emergency contact setup → Demographic information → Falls efficacy questionnaire → Chair stand assessment → Smartphone accelerometer / motion sensor input → Computer vision / sensor analytics → Ability–confidence analytics engine → Risk stratification → Dashboard + report + recommendations → Care linkage to Active Ageing Centre / Community Health Post / Physiotherapy Clinic

The hackathon demo should show **one polished end-to-end patient journey**, not many unfinished portals.

## MVP scope

Build these first:
1. Patient-first web app
2. Safety screening and consent
3. Emergency contact setup
4. Demographic information
5. Four-domain falls efficacy questionnaire
6. Chair stand assessment as the core functional test
7. Smartphone accelerometer / motion sensor input
8. Computer vision or sensor-derived chair stand metrics
9. Rule-based ability–confidence analytics
10. Dashboard, report, recommendations, and care linkage

Optional extensions:
- gait speed
- floor rising
- caregiver view
- therapist view
- machine learning
- benchmark research database

These extensions must not block the core demo.

## Team module ownership

- Shaun: Clinical Product Owner. Owns falls efficacy framework, safety, questionnaire, recommendations, literature, and final clinical review. Shaun does **not** need to use Codex directly.
- Wayne: App flow, UX, rough UI, integration, and repo coordination. Wayne is **not** the sole project manager.
- Daniel: Motion sensor / accelerometer module.
- Ezekiel: Computer vision / chair stand module.
- Whole team: demo quality, integration, and final submission.

## Remote work rule

Nobody owns the whole product. Each person owns a module. The team owns the demo.

Monday night: review and status alignment.  
Tuesday: integration.  
Wednesday: final submission.

## Recommended reading order for Codex

1. `CONSTITUTION.md`
2. `README.md`
3. `CODEX_HANDOFF.md`
4. `architecture.md`
5. `integration.md`
6. `clinical.md`
7. `docs/orchestrator.md`
8. `docs/config.md`
9. The relevant `docs/agents/*.md` file for the module being built

## Definition of done for the hackathon

A judge can watch one older-adult persona complete the journey and understand:
- what problem Physio-Aid solves
- why ability and confidence both matter
- how chair stand and falls efficacy feed into the profile
- why the output is decision support, not diagnosis
- what recommendation or care linkage happens next

The hero screen should be the **Ability–Confidence Dashboard** showing ability, confidence, profile interpretation, risk category, recommendations, and care linkage.
