# Agent Context Notes

- Read `AGENTS.md`, then `agent-context/index.json`, then `agent-context/tasks.json` before opening broad human docs.
- Treat `Docs/` as secondary human-facing documentation. Use it only when a task needs feature background that is not in the context bundle.
- `app/page.tsx` is the main dashboard client orchestration surface and is a common fan-in point for UI changes.
- Season logic is computed in `lib/seasons.ts`; historical migration files still mention removed season-table structures.
- `app/api/players/route.ts` and `app/api/matches/route.ts` return enriched payloads that front-end code consumes directly.
- Ranking and trend features depend on game-level stats semantics from `app/lib/stats.ts`, not just match win/loss counts.
- When context files look stale after structural edits, regenerate them with `pnpm run context:generate` and commit the updated JSON.
