# Physio-Aid Team Agent Prompts

These prompts are ready to paste into Codex, Claude Code, or another coding agent after a teammate checks out the repo.

Before any module work, every agent should read:

1. `docs/handoff/START_HERE.md`
2. `docs/handoff/CONSTITUTION.md`
3. `docs/handoff/CODEX_HANDOFF.md`
4. The role-specific brief in `docs/handoff/docs/agents/`

Use one feature branch per teammate. Do not work directly on `main`.

## Team Branches

- Wayne: `feature/wayne-pwa-flow`
- Daniel: `feature/daniel-motion-tests`
- Ezekiel: `feature/ezekiel-floor-rising-cv`
- Shaun / clinical support: `feature/clinical-copy-rules`
- QA: `feature/qa-demo-readiness`

## Pull Request Rule

Every pull request should include:

- What changed
- Files touched
- Contract changes
- How to test
- Fallback behavior
- Risks or blockers

Never add diagnosis, prescription, autonomous medical advice, or clinical validation claims.
