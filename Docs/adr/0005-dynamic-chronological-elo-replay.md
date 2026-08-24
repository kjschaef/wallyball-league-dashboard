# Dynamic Chronological Elo Computation

Player ratings are computed dynamically in-memory via chronological match replay in `app/lib/stats.ts` rather than persisted as mutable columns on the `players` table. Because match volume is lightweight and match edits/corrections occasionally occur, dynamic replay guarantees strict data integrity and automatic self-healing without requiring database migration tables or rollback triggers.
