-- Migration: remove seasons table and season_id column from matches
-- This migration will:
-- 1) Drop foreign key constraint on matches.season_id (if exists)
-- 2) Drop indexes related to season_id
-- 3) Drop the season_id column from matches
-- 4) Drop the seasons table

DO $$ BEGIN
  -- Drop FK constraint on matches.season_id if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'matches' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'season_id'
  ) THEN
    ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_season_id_fkey;
  END IF;
EXCEPTION WHEN others THEN
  -- ignore
  RAISE NOTICE 'Could not drop matches_season_id_fkey (ignored)';
END $$;

-- Drop indexes that reference season_id
DROP INDEX IF EXISTS match_season_date_idx;
DROP INDEX IF EXISTS match_season_idx;

-- Remove season_id column from matches (if present)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='season_id') THEN
    ALTER TABLE matches DROP COLUMN IF EXISTS season_id;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not drop column season_id from matches (ignored)';
END $$;

-- Drop seasons table
DROP TABLE IF EXISTS seasons;

-- Drop season-related indexes if any remain
DROP INDEX IF EXISTS season_active_idx;
DROP INDEX IF EXISTS season_start_date_idx;

-- Done
