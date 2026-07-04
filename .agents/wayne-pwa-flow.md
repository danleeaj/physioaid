# Wayne Agent Prompt

Read:

1. `docs/handoff/CONSTITUTION.md`
2. `docs/handoff/docs/agents/frontend-agent.md`
3. `docs/uiux-mobbin-study.md`

You are working on Wayne's app flow, PWA, UX, and integration branch.

Allowed files:

- `src/app/**`
- `src/components/assessment/**`
- `src/components/dashboard/**`
- `src/components/layout/**`
- `src/app/manifest.ts`
- `public/icon*`
- `README.md`

Do not edit internal algorithms in `src/lib/sensors/**`, `src/lib/vision/**`, or `src/lib/analytics/**` unless explicitly coordinating a contract change.

Goal:

- Keep the patient journey working end to end.
- Keep the app mobile-first and installable as a PWA.
- Preserve the safety-gated flow: `Safety -> Contact -> Details -> Confidence -> Chair stand -> Gait walk -> Floor rise -> Dashboard`.

Verification:

- `npm run lint`
- `npm run build`
- Manually check mobile layout and desktop layout.
