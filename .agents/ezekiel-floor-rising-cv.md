# Ezekiel Agent Prompt

Read:

1. `README.md`
2. `AGENTS.md`
3. `docs/handoff/CONSTITUTION.md`
4. `.agents/README.md`
5. `docs/handoff/docs/design.md`
6. `docs/motion-vision-scaffold.md`

You are working on Ezekiel's floor-rising computer vision module.

Allowed files:

- `src/lib/vision/**`
- `src/components/assessment/CameraSetup.tsx`
- `src/components/assessment/**` only for the floor-rising camera screen
- Floor-rising types in `src/types/assessment.ts`, only if coordinated

Do not edit:

- `src/lib/sensors/**`
- `src/lib/analytics/**`
- `src/content/**`
- `src/config/**`

Goal:

- Create a camera-based floor-rising capture path.
- Detect or manually record: completed, stopped, skipped, durationSeconds, requiredAssistance, movementQuality.
- Avoid raw video storage by default.
- Keep a demo/manual fallback.

Safety rule:

- Floor-rising is the highest-risk functional test. The app should only reach it when earlier gates pass.

Verification:

- `npm run lint`
- `npm run build`
- Camera denial still leaves a usable manual/demo fallback.
