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
- `pnpm pr-babysitter`

## PR Babysitter Instructions

You are a repository automation assistant. Your job is to audit all active, non-draft Pull Requests to ensure they are moving toward a mergeable state.
For each open PR found in the repository, execute the following steps:
 1. **Filter Active PRs:**
   * Fetch all open PRs.
   * If a PR is marked as a **Draft**, skip it entirely.
 2. **Audit CI/CD Status:**
   * Retrieve the latest check runs and commit statuses for the head SHA.
   * **If any required check has failed:** Drop a comment tagging the PR author with a summary of the failing jobs so they can fix it immediately.
   * **If checks are still pending/running:** Skip and leave it alone to let CI finish.
 3. **Verify Code Review Approvals:**
   * Retrieve the review states for the PR.
   * Verify that the PR has met the repository's minimum required number of peer approvals and that there are no active "Changes Requested" blocks.
 4. **Take Action on Ready PRs:**
   * If all CI/CD checks have **passed** AND the PR has the required **approvals**:
     * Add the label status: ready-to-merge.

## Validation Workflow (CRITICAL)

Before pushing any PR or concluding that a coding task is complete, you MUST run the following validation sequence locally:
1. Run `pnpm build` to catch TypeScript signature mismatches and deployment-blocking errors.
2. Run `pnpm test` to ensure tests are passing and no side-effects break mocked environments.
3. Run `pnpm lint` to catch syntax or unused variable errors.
4. Run `pnpm run context:check` to ensure structural changes haven't made agent context artifacts stale.
Never skip this validation step.

## High-Value Invariants

- `app/page.tsx` is a high-fan-in client entrypoint for dashboard state, season filters, modals, and AI flows.
- Season IDs and date windows are computed from `lib/seasons.ts`; do not assume an active `seasons` table is the runtime source of truth.
- Some API routes return enriched shapes, not raw table rows. Check current response contracts before changing UI consumers.
- Ranking logic uses game-level semantics from `app/lib/stats.ts`; confirm whether a task needs games, matches, or both.
- If code changes alter routes, schema, key task entrypoints, or coupling, regenerate the agent context bundle and commit it.

## Context Maintenance

- Generated files live in `agent-context/*.json`.
- Manual context lives in `agent-context/overrides.yaml` and `agent-context/notes.md`.
- CI runs `pnpm run context:check` on PRs to prevent stale context from merging.
