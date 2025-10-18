-- Create inactivity_exemptions table
CREATE TABLE IF NOT EXISTS inactivity_exemptions (
  id serial PRIMARY KEY,
  player_id integer NOT NULL REFERENCES players(id),
  reason text,
  start_date timestamp NOT NULL,
  end_date timestamp,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inactivity_exemption_player_idx ON inactivity_exemptions(player_id);
CREATE INDEX IF NOT EXISTS inactivity_exemption_start_idx ON inactivity_exemptions(start_date);

