CREATE TABLE IF NOT EXISTS "match_games" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"game_number" integer NOT NULL,
	"team_one_score" integer NOT NULL,
	"team_two_score" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_games" ADD CONSTRAINT "match_games_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "match_games_match_id_idx" ON "match_games" USING btree ("match_id");