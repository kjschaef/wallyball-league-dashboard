CREATE TABLE IF NOT EXISTS "daily_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"summary" text NOT NULL,
	"last_match_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_password_hash" text,
	"signup_open_day_of_week" integer DEFAULT 0,
	"signup_open_time" text DEFAULT '12:00',
	"signup_close_day_of_week" integer DEFAULT 0,
	"signup_close_time" text DEFAULT '16:00',
	"available_days" text DEFAULT '["Monday","Tuesday","Thursday"]'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "weekly_signups" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"date" text NOT NULL,
	"status" text DEFAULT 'registered' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "weekly_unavailable" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"week_start" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "seasons" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "seasons" CASCADE;--> statement-breakpoint
ALTER TABLE "player_achievements" DROP CONSTRAINT "player_achievements_player_id_fkey";
--> statement-breakpoint
ALTER TABLE "player_achievements" DROP CONSTRAINT "player_achievements_achievement_id_fkey";
--> statement-breakpoint
ALTER TABLE "matches" DROP CONSTRAINT "matches_team_one_player_one_id_fkey";
--> statement-breakpoint
ALTER TABLE "matches" DROP CONSTRAINT "matches_team_one_player_two_id_fkey";
--> statement-breakpoint
ALTER TABLE "matches" DROP CONSTRAINT "matches_team_one_player_three_id_fkey";
--> statement-breakpoint
ALTER TABLE "matches" DROP CONSTRAINT "matches_team_two_player_one_id_fkey";
--> statement-breakpoint
ALTER TABLE "matches" DROP CONSTRAINT "matches_team_two_player_two_id_fkey";
--> statement-breakpoint
ALTER TABLE "matches" DROP CONSTRAINT "matches_team_two_player_three_id_fkey";
--> statement-breakpoint
ALTER TABLE "matches" DROP CONSTRAINT "matches_season_id_fkey";
--> statement-breakpoint
DROP INDEX IF EXISTS "match_season_date_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "match_season_idx";--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "player_achievements" ALTER COLUMN "unlocked_at" SET DEFAULT now();--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "weekly_signups" ADD CONSTRAINT "weekly_signups_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "weekly_unavailable" ADD CONSTRAINT "weekly_unavailable_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_summary_date_idx" ON "daily_summaries" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weekly_signup_date_idx" ON "weekly_signups" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weekly_signup_player_date_idx" ON "weekly_signups" USING btree ("player_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weekly_unavailable_week_start_idx" ON "weekly_unavailable" USING btree ("week_start");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weekly_unavailable_player_week_idx" ON "weekly_unavailable" USING btree ("player_id","week_start");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_achievements" ADD CONSTRAINT "player_achievements_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_achievements" ADD CONSTRAINT "player_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_team_one_player_one_id_players_id_fk" FOREIGN KEY ("team_one_player_one_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_team_one_player_two_id_players_id_fk" FOREIGN KEY ("team_one_player_two_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_team_one_player_three_id_players_id_fk" FOREIGN KEY ("team_one_player_three_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_team_two_player_one_id_players_id_fk" FOREIGN KEY ("team_two_player_one_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_team_two_player_two_id_players_id_fk" FOREIGN KEY ("team_two_player_two_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_team_two_player_three_id_players_id_fk" FOREIGN KEY ("team_two_player_three_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "matches" DROP COLUMN IF EXISTS "season_id";