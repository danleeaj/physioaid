# Physio-Aid Team Agent Prompts

These prompts are the canonical teammate-ready instructions to paste into Codex, Claude Code, or another coding agent after a teammate checks out the repo.

Repo: `https://github.com/wlcsmmm/physioaid`

GitHub `main` and the linked Vercel deployment are the source of truth. Do not rely on stale local dev servers for current UI state.

## Read First

Every teammate should read:

1. `README.md`
2. `AGENTS.md`
3. `docs/handoff/CONSTITUTION.md`
4. Their role-specific prompt in this folder
5. `docs/motion-vision-scaffold.md` for motion or camera work

Older files under `docs/handoff/docs/agents/`, `docs/handoff/START_HERE.md`, and `docs/handoff/CODEX_HANDOFF.md` are retained only as compatibility pointers.

## Team Branches

- Wayne: `feature/wayne-pwa-flow`
- Daniel: `feature/daniel-motion-tests`
- Ezekiel: `feature/ezekiel-floor-rising-cv`
- Shaun / clinical support: `feature/clinical-copy-rules`
- QA: `feature/qa-demo-readiness`

Do not work directly on `main`.

## Pull Request Rule

Every pull request should include:

- What changed
- Files touched
- Contract changes
- How to test
- Fallback behavior
- Risks or blockers

Before opening a pull request, run:

- `npm run lint`
- `npm run build`

Never add diagnosis, prescription, autonomous medical advice, or clinical validation claims.
