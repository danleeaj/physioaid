# QA Agent Prompt

Read:

1. `docs/handoff/CONSTITUTION.md`
2. `docs/handoff/docs/agents/qa-agent.md`
3. `docs/handoff/demo.md`

You are checking demo readiness.

Allowed files:

- `README.md`
- `docs/**`
- `tests/**` if tests are added
- Small UI bug fixes only after confirming ownership

Checklist:

- Full patient journey reaches dashboard.
- Safety screen blocks physical testing when unsafe.
- Emergency contact appears before movement testing.
- Chair stand, gait walk, and floor-rising have demo/manual fallback.
- Dashboard uses decision-support language.
- No diagnosis or clinical validation claims.
- Mobile PWA renders cleanly on iPhone-sized screens.
- `npm run lint` passes.
- `npm run build` passes.
