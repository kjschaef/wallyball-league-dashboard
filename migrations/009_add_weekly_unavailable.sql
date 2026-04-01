CREATE TABLE IF NOT EXISTS weekly_unavailable (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(player_id, week_start)
);

CREATE INDEX IF NOT EXISTS weekly_unavailable_week_start_idx ON weekly_unavailable(week_start);
