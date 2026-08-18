# Canonical Matches API and Route Consolidation

To resolve domain ambiguity between a **Match** (multi-game contest) and a **Game** (individual round) and eliminate duplicated logic, all match operations (creation, reading, updating, deletion, and nested game score logging) are consolidated under `/api/matches` and `/api/matches/[id]`. The legacy redundant `/api/games` route handlers are removed.
