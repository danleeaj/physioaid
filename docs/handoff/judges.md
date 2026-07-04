# Judges Brief — Rubric Alignment

This document maps Physio-Aid to the hackathon judging rubric.

## 1. Problem Significance and Clinical Relevance

Physio-Aid addresses frailty and falls, two interlinked ageing problems. The brief states that approximately 6.2% of older adults in Singapore are frail and 37% are pre-frail, while around one in three older adults are at risk of falling.

The clinical relevance is that falls can signal a transition from early vulnerability to disability, reduced confidence, hospitalisation, and care dependence. Physio-Aid focuses on the modifiable window before a fall or frailty-related crisis occurs.

Strong judge message:
> The gap is clear: we need a scalable way to detect early functional decline and falls-related confidence issues before they become hospital problems.

## 2. Innovation and Creativity

Physio-Aid is not just movement detection. It combines:
- functional movement assessment
- falls efficacy profiling
- smartphone motion sensing
- camera-based analytics
- ability–confidence interpretation
- care recommendations and linkage

The innovation is the ability–confidence profile:
- good ability + low confidence
- poor ability + high confidence
- poor ability + low confidence
- good ability + good confidence

Strong judge message:
> Our innovation is interpreting the gap between what an older adult can do and what they believe they can do.

## 3. Technical Quality and Implementation

The architecture is practical:
- patient web app
- guided safety screening and consent
- emergency contact setup
- demographics
- falls efficacy questionnaire
- camera-based chair stand assessment
- smartphone accelerometer input
- rule-based analytics
- dashboard and report

Technical quality should be shown through an end-to-end demo, not just individual components. The technical MVP should be robust enough to show fallbacks if camera or sensor permissions fail.

Strong judge message:
> The MVP turns a simple chair stand test and four confidence questions into an ability–confidence profile, risk category, recommendation, and care linkage.

## 4. Feasibility and Translation Potential

The platform is feasible because it uses common tools:
- chair
- camera-enabled device
- smartphone accelerometer
- short questionnaire
- web app dashboard

Potential settings:
- home
- Active Ageing Centre
- Community Health Post
- Physiotherapy Clinic
- rehabilitation service
- research network with explicit consent

The MVP is not a laboratory-only system.

Strong judge message:
> Physio-Aid is community-ready. It can be used with a chair, a camera, smartphone sensors, and a few minutes of guided assessment.

## 5. Presentation and Demonstration

Use one persona: Mr Tan, 78.

The demonstration must be:
- simple
- visual
- clinically meaningful
- easy to follow
- patient-first
- less than three minutes if possible

The hero screen should be the Ability–Confidence Dashboard. Judges should see the profile, interpretation, risk category, recommendations, report, and care linkage.

## Anticipated Q&A

### Is this a diagnostic tool?

No. Physio-Aid is decision support and screening. It does not diagnose frailty or prescribe treatment. It helps older adults and care teams decide when to maintain, monitor, support, or escalate care.

### Is this clinically validated?

Not yet. The MVP is a hackathon prototype aligned with physiotherapy concepts and literature from the brief. Clinical validation is future work.

### Why chair stand?

Chair stand is simple, recognisable, feasible in homes and community settings, and relevant to lower-limb function. For the MVP, it is the core functional test. Gait speed and floor rising are optional extensions.

### Why combine confidence and ability?

Because ability alone misses behavioural risk. Someone with good ability but low confidence may avoid movement and decondition. Someone with poor ability but high confidence may take unsafe risks. The mismatch is clinically meaningful.

### Why not build caregiver and therapist dashboards?

For the MVP, scope is intentionally tight. The patient journey and shareable report are enough to show value. Separate portals can come later.

### How do you handle privacy?

The MVP uses consent, emergency contact setup, minimal data collection, derived movement metrics where possible, optional research consent, and PDPA-aware design.
