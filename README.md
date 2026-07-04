# Physio-Aid

Physio-Aid is a web-based physiotherapy support platform focused on prolonging healthspan by preventing frailty progression and falls in older adults.

The MVP combines safety screening, emergency contact setup, falls efficacy profiling, chair stand assessment, motion/CV-derived metrics, and a rule-based ability-confidence profile. It provides decision support and care recommendations. It is not a diagnosis and does not replace assessment by a qualified healthcare professional.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

If the dev server reports too many open files, use polling mode:

```bash
WATCHPACK_POLLING=true WATCHPACK_POLLING_INTERVAL=1000 npm run dev
```

## Demo Path

Use the `Load Mr Tan demo` button, then walk through:

```txt
Landing -> Safety -> Emergency Contact -> Demographics -> Falls Efficacy -> Chair Stand -> Analytics -> Dashboard -> Report
```

The demo remains usable even before camera or motion permissions are implemented.

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
src/types/assessment.ts only when coordinating contract changes
```

Ezekiel owns computer vision and chair stand detection:

```txt
src/lib/vision/**
src/components/assessment/** only when integrating camera UI with Wayne
src/types/assessment.ts only when coordinating contract changes
```

Shared files require team notice before changes:

```txt
src/types/assessment.ts
src/lib/analytics/**
src/config/**
src/content/**
package.json
```

## Branches

Use one branch per module:

```txt
feature/wayne-app-flow
feature/daniel-motion-sensor
feature/ezekiel-chair-stand-cv
feature/clinical-copy-rules
feature/report-dashboard
```

Do not work directly on `main` after the initial scaffold.

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

The Codex handoff pack is copied into:

```txt
docs/handoff/
```

Start with `docs/handoff/START_HERE.md` and `docs/handoff/CONSTITUTION.md`.
