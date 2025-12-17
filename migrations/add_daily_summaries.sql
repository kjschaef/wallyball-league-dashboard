-- Manual migration to add daily_summaries table
-- This avoids the drizzle-kit issue with the non-existent foreign key constraint

CREATE TABLE IF NOT EXISTS daily_summaries (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  summary TEXT NOT NULL,
  last_match_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS daily_summary_date_idx ON daily_summaries(date);

-- Also clean up the unused seasons table and season_id column if they exist
DROP TABLE IF EXISTS seasons CASCADE;
ALTER TABLE matches DROP COLUMN IF EXISTS season_id;
