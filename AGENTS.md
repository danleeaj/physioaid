# Agent Instructions

Repo: `https://github.com/wlcsmmm/physioaid`

GitHub `main` and the linked Vercel deployment are the source of truth. Do not trust stale local dev servers for current UI state.

## Read First

1. `README.md`
2. `docs/handoff/CONSTITUTION.md`
3. `.agents/README.md`
4. The relevant teammate prompt in `.agents/`
5. `docs/motion-vision-scaffold.md` for motion or camera work

## Current Flow

`Safety + Consent -> Emergency Contact -> Demographics -> Falls Efficacy / Confidence -> Chair Stand -> Motion Sensor Gait Walking -> Floor-Rising -> Ability-Confidence Dashboard`

The flow is safety-gated. Unsafe or stopped physical tests must not proceed to higher-risk tests.

## Work Rules

Use one feature branch per teammate. Do not work directly on `main`.

Respect module ownership. Do not change shared contracts, clinical copy, thresholds, or package dependencies without calling out the change.

Use decision-support language. Do not claim diagnosis, prescription, autonomous medical advice, or clinical validation.
