CREATE TABLE IF NOT EXISTS "site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_password_hash" text,
	"signup_open_day_of_week" integer DEFAULT 0,
	"signup_open_time" text DEFAULT '12:00',
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
DO $$ BEGIN
 ALTER TABLE "weekly_signups" ADD CONSTRAINT "weekly_signups_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weekly_signup_date_idx" ON "weekly_signups" ("date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weekly_signup_player_date_idx" ON "weekly_signups" ("player_id","date");
