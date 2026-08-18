# Relational Match Games Table

To enable granular player performance metrics (such as point differential, scoring averages, and per-game margins) while keeping score entry optional, individual game point tallies are stored in a dedicated `match_games` relational table linked to `matches(id)` via foreign key rather than denormalized JSON columns on `matches`. This allows standard SQL aggregations, indexing, and straightforward data expansion for deeper analytical queries.
