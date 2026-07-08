# Agent Router

Read in this order unless the task is trivial:

1. `agent-context/index.json`
2. `agent-context/tasks.json`
3. `agent-context/routes.json` or `agent-context/data-model.json` as needed
4. `agent-context/graph.json` when you need coupling or blast radius

Use `Docs/` as secondary human-oriented documentation. Do not default to it for repo navigation.

## Repo Summary

- Next.js app-router project with API routes under `app/api`.
- Main dashboard orchestration lives in `app/page.tsx`.
- Shared app logic lives in `app/lib`; cross-cutting season logic lives in `lib/seasons.ts`.
- Database schema source of truth is `db/schema.ts`; historical context lives in `migrations/`.
- Tests are primarily under `__tests__/api`, `__tests__/components`, and local `__tests__` folders.

## Canonical Commands

- `pnpm dev`
- `pnpm build`
- `pnpm test`
- `pnpm lint`
- `pnpm run context:generate`
- `pnpm run context:check`
- `bin/pr-list`
- `bin/pr-audit-status`
- `bin/pr-audit-reviews`
- `bin/pr-comment`
- `bin/pr-label-ready`
- `bin/pr-label-remove`

## PR Babysitter Instructions

You are a repository automation assistant. Your job is to audit all active, non-draft Pull Requests to ensure they are moving toward a mergeable state.
For each open PR found in the repository, you can leverage the dedicated bash scripts in `bin/`:
 1. **Filter Active PRs:**
   * Fetch open PRs using `./bin/pr-list`. This returns active (non-draft) PR numbers and titles.
 2. **Audit CI/CD Status:**
   * Audit statuses using `./bin/pr-audit-status <pr-number>`.
   * **If any check has failed (exits with 1):** Drop a comment tagging the PR author with a summary of the failing jobs (using `./bin/pr-comment <pr-number> "<message>"`) so they can fix it immediately.
   * **If checks are still pending/running (exits with 2):** Skip and leave it alone.
 3. **Verify Code Review Approvals:**
   * Audit reviews using `./bin/pr-audit-reviews <pr-number> [min-approvals]`.
   * If there are active `CHANGES_REQUESTED` (exits with 1) or insufficient approvals (exits with 2), skip it.
 4. **Take Action on Ready PRs:**
   * If both status and reviews audit report success (exit 0), add the `status: ready-to-merge` label using `./bin/pr-label-ready <pr-number>`.
   * If a previously ready PR is no longer ready, remove the label using `./bin/pr-label-remove <pr-number>`.

## Validation Workflow (CRITICAL — ALL AGENTS MUST FOLLOW)

This applies to every agent (Jules, Claude, Gemini, etc.) without exception.
Do NOT open or propose a PR until every step below passes cleanly.

1. **`pnpm build`** — catches TypeScript errors and deployment-blocking issues.
2. **`pnpm test`** — ensures no regressions in the Jest unit/component suite.
3. **`pnpm lint`** — catches ESLint errors and unused variable warnings.
4. **`pnpm run context:check`** — ensures agent context artifacts are not stale.
5. **Snyk security scan** — run `npx snyk code test` (or equivalent) on any new or modified first-party code. If issues are found, fix them and re-scan before opening a PR.

If `context:check` fails AND the task altered routes, schema, key entrypoints, or module coupling, also run `pnpm run context:generate` and commit the updated artifacts.

Never skip any step in this sequence.

## High-Value Invariants

- `app/page.tsx` is a high-fan-in client entrypoint for dashboard state, season filters, modals, and AI flows.
- Season IDs and date windows are computed from `lib/seasons.ts`; do not assume an active `seasons` table is the runtime source of truth.
- Some API routes return enriched shapes, not raw table rows. Check current response contracts before changing UI consumers.
- Ranking logic uses game-level semantics from `app/lib/stats.ts`; confirm whether a task needs games, matches, or both.
- If code changes alter routes, schema, key task entrypoints, or coupling, run `pnpm run context:generate` and commit the updated artifacts alongside your code changes.

## Context Maintenance

- Generated files live in `agent-context/*.json`.
- Manual context lives in `agent-context/overrides.yaml` and `agent-context/notes.md`.
- CI runs `pnpm run context:check` on PRs to prevent stale context from merging.
