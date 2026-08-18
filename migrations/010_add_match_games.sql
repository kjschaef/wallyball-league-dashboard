CREATE TABLE IF NOT EXISTS "match_games" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL REFERENCES "matches"("id") ON DELETE CASCADE,
	"game_number" integer NOT NULL,
	"team_one_score" integer NOT NULL,
	"team_two_score" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "match_games_match_id_idx" ON "match_games" ("match_id");
