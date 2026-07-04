# Daniel Agent Prompt

Read:

1. `README.md`
2. `AGENTS.md`
3. `docs/handoff/CONSTITUTION.md`
4. `.agents/README.md`
5. `docs/motion-vision-scaffold.md`

You are working on Daniel's motion sensor module.

Allowed files:

- `src/lib/sensors/**`
- `src/types/motion.ts`
- `src/components/assessment/MotionSensorStatus.tsx`
- Motion-related types in `src/types/assessment.ts`, only if the contract change is necessary
- Motion test UI inside `src/components/assessment/**`, only when coordinated with Wayne

Do not edit:

- `src/lib/vision/**`
- `src/content/**`
- `src/config/**`
- Dashboard/report copy unless asked

Goal:

- Implement iPhone/Android browser motion permission handling.
- Record accelerometer/gyroscope samples in a PWA over HTTPS.
- Build chair stand and gait walking summaries from phone motion signals.
- Keep manual and demo fallback paths.

Expected outputs:

- Chair stand metrics: repetitions, durationSeconds, movementQuality, completionStatus, source.
- Motion gait metrics: gaitSpeedMetersPerSecond, stabilityScore, rhythmConsistency, completionStatus, source.

Safety rule:

- If chair stand is stopped or unsafe, the app must not proceed to gait walking.
- If gait walking is stopped or unstable, the app must not proceed to floor-rising.

Verification:

- `npm run lint`
- `npm run build`
- Test on HTTPS Vercel URL using an iPhone Safari tap-triggered permission flow.
