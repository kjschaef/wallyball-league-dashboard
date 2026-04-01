CREATE TABLE IF NOT EXISTS "players" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "start_year" integer,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "achievements" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "icon" text NOT NULL,
  "condition" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player_achievements" (
  "id" serial PRIMARY KEY NOT NULL,
  "player_id" integer NOT NULL,
  "achievement_id" integer NOT NULL,
  "unlocked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "matches" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_one_player_one_id" integer,
  "team_one_player_two_id" integer,
  "team_one_player_three_id" integer,
  "team_two_player_one_id" integer,
  "team_two_player_two_id" integer,
  "team_two_player_three_id" integer,
  "team_one_games_won" integer NOT NULL,
  "team_two_games_won" integer NOT NULL,
  "date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_summaries" (
  "id" serial PRIMARY KEY NOT NULL,
  "date" text NOT NULL,
  "summary" text NOT NULL,
  "last_match_id" integer,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_achievements" ADD CONSTRAINT "player_achievements_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_achievements" ADD CONSTRAINT "player_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_team_one_player_one_id_fkey" FOREIGN KEY ("team_one_player_one_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_team_one_player_two_id_fkey" FOREIGN KEY ("team_one_player_two_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_team_one_player_three_id_fkey" FOREIGN KEY ("team_one_player_three_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_team_two_player_one_id_fkey" FOREIGN KEY ("team_two_player_one_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_team_two_player_two_id_fkey" FOREIGN KEY ("team_two_player_two_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_team_two_player_three_id_fkey" FOREIGN KEY ("team_two_player_three_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "player_achievement_idx" ON "player_achievements" USING btree ("player_id","achievement_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_one_player_one_idx" ON "matches" USING btree ("team_one_player_one_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_one_player_two_idx" ON "matches" USING btree ("team_one_player_two_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_one_player_three_idx" ON "matches" USING btree ("team_one_player_three_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_two_player_one_idx" ON "matches" USING btree ("team_two_player_one_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_two_player_two_idx" ON "matches" USING btree ("team_two_player_two_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_two_player_three_idx" ON "matches" USING btree ("team_two_player_three_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_summary_date_idx" ON "daily_summaries" USING btree ("date");
