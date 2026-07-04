# Design Direction

## Design goal

Make the app feel safe, calm, clinical, and easy for older adults to complete with minimal confusion.

## Primary design principles

- older-adult friendly
- large typography
- high contrast
- clear progress indicators
- minimal steps per screen
- calm clinical visual style
- plain language
- large tap targets
- no cluttered dashboards
- visible safety guidance
- forgiving error states

## Visual hierarchy

The most important screen is the Ability–Confidence Dashboard.

It should show:
1. ability
2. confidence
3. ability–confidence profile
4. interpretation
5. risk category
6. recommendations
7. care linkage
8. report export/share

Do not hide the profile behind a generic score.

## Step design

Each assessment step should have:
- title
- one short explanation
- input
- next button
- back button
- progress indicator
- safety note when relevant

## Typography

Suggested:
- base font size: 18px or above
- large screen titles: 32px or above
- button text: 18px or above
- line height: comfortable
- avoid dense paragraphs in the UI

## Colour and contrast

Use high contrast. Avoid relying on colour alone for risk categories.

Risk category labels should include text and icon/shape:
- Low: maintain and monitor
- Moderate: support recommended
- High: seek support or professional review

Do not use alarming red-heavy design unless safety requires it.

## Tone

Use:
- supportive
- respectful
- calm
- non-judgmental
- clear

Avoid:
- blame
- fear-based messaging
- medical certainty
- complex clinical jargon

## Landing page

Required content:
- Physio-Aid name
- value proposition
- start assessment
- decision-support disclaimer
- short mention of movement, confidence, care recommendations

Example hero:
> Understand movement, confidence, and care needs before a fall happens.

## Safety screen

This screen must feel important but not frightening.

Use copy:
> Before we start, we need to check that it is safe for you to do a simple chair stand movement test today.

If unsafe:
> Please do not continue with the movement test right now. Consider asking someone to support you or seek advice from a community or healthcare professional.

## Chair stand screen

Must include:
- stable chair instruction
- clear space instruction
- stop conditions
- start button
- camera preview if available
- sensor status
- manual/demo fallback

## Dashboard layout

Suggested sections:
1. Summary card
2. Ability card
3. Confidence card
4. Ability–confidence profile card
5. Functional-falls risk category
6. Recommendations
7. Care linkage
8. Report export

## Accessibility checklist

- keyboard navigable
- visible focus states
- labels for all inputs
- no tiny sliders without numeric value
- good contrast
- no auto-advancing steps
- instructions available before camera starts
- errors written in plain language
- large click/tap areas
- readable on tablet and laptop

## What not to design

Do not design:
- a complex clinician dashboard for MVP
- a caregiver social portal
- a data science dashboard as the hero screen
- a native mobile-only flow
- a generic fall risk score UI
- a fear-based red alert interface
