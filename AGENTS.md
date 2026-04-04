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
