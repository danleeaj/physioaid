# Physio-Aid

Physio-Aid is a web-based physiotherapy support platform focused on prolonging healthspan by preventing frailty progression and falls in older adults.

The MVP combines safety screening, emergency contact setup, falls efficacy profiling, chair stand assessment, motion/CV-derived metrics, and a rule-based ability-confidence profile. It provides decision support and care recommendations. It is not a diagnosis and does not replace assessment by a qualified healthcare professional.

## Source Of Truth

Repo: `https://github.com/wlcsmmm/physioaid`

GitHub `main` and the linked Vercel deployment are the source of truth for teammate work and demo verification.

Do not rely on an old local dev server to decide whether the app is current. Vercel/GitHub should be trusted for current state.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## PWA

Physio-Aid is configured as a PWA with:

- `src/app/manifest.ts`
- install icons in `public/`
- iOS web app metadata in `src/app/layout.tsx`

For real mobile motion sensor testing, use the HTTPS Vercel URL on iPhone Safari. Local `http://127.0.0.1` is useful for UI work, but not enough for the production-like permission path.

If the dev server reports too many open files, use polling mode:

```bash
WATCHPACK_POLLING=true WATCHPACK_POLLING_INTERVAL=1000 npm run dev
```

## Demo Path

Use the `Load Mr Tan demo` button, then walk through:

```txt
Landing -> Safety + Consent -> Emergency Contact -> Demographics -> Falls Efficacy / Confidence -> Chair Stand -> Motion Sensor Gait Walking -> Floor-Rising -> Ability-Confidence Dashboard -> Report
```

The demo remains usable even before camera or motion permissions are implemented.

The flow is safety-gated:

- If safety screening fails, physical testing stops and the app routes to the dashboard.
- If chair stand is stopped, unsafe, or too poor, the user must not proceed to gait walking.
- If gait walking is stopped or unstable, the user must not proceed to floor-rising.
- Floor-rising is the highest-risk test and must keep skip, manual, and demo fallbacks.

## Module Ownership

Wayne owns app flow, UX, integration, and repo coordination:

```txt
src/app/**
src/components/assessment/**
src/components/dashboard/**
src/components/layout/**
```

Daniel owns motion sensor and accelerometer work:

```txt
src/lib/sensors/**
src/types/motion.ts
src/components/assessment/MotionSensorStatus.tsx
src/types/assessment.ts only when coordinating necessary motion contract changes
```

Ezekiel owns floor-rising computer vision work:

```txt
src/lib/vision/**
src/components/assessment/CameraSetup.tsx
src/components/assessment/** only for the floor-rising camera screen
src/types/assessment.ts only when coordinating necessary floor-rising contract changes
```

Shared files require team notice before changes:

```txt
src/types/assessment.ts
src/lib/analytics/**
src/config/**
src/content/**
package.json
```

Ready-to-use teammate prompts live in `.agents/`.

## Branches

Use one branch per module:

```txt
feature/wayne-pwa-flow
feature/daniel-motion-tests
feature/ezekiel-floor-rising-cv
feature/clinical-copy-rules
feature/qa-demo-readiness
```

Do not work directly on `main`.

## For Teammates

1. Clone `https://github.com/wlcsmmm/physioaid`.
2. Create your assigned feature branch.
3. Read `AGENTS.md`.
4. Read `.agents/README.md`.
5. Read your role prompt in `.agents/`.
6. Read `docs/handoff/CONSTITUTION.md`.
7. For motion or camera work, also read `docs/motion-vision-scaffold.md`.
8. Run `npm run lint` and `npm run build` before opening a PR.
9. Open a pull request into `main`.

## PR Checklist

Every pull request should say:

- What changed
- Files touched
- Contract changes
- How to test
- Fallback behavior
- Risks or blockers

Before merge:

- `npm run lint` passes
- `npm run build` passes
- The patient journey still reaches the dashboard
- No diagnosis or clinical validation claims were added
- No raw video storage is added by default

## Handoff Docs

For new work, start with:

1. `AGENTS.md`
2. `.agents/README.md`
3. The relevant role prompt in `.agents/`
4. `docs/handoff/CONSTITUTION.md`
5. `docs/motion-vision-scaffold.md` for motion or camera work

The older `docs/handoff/START_HERE.md`, `docs/handoff/CODEX_HANDOFF.md`, `docs/handoff/docs/orchestrator.md`, and `docs/handoff/docs/agents/*.md` files are compatibility pointers only.
