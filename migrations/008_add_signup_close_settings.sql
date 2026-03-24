ALTER TABLE "site_settings"
ADD COLUMN IF NOT EXISTS "signup_close_day_of_week" integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "site_settings"
ADD COLUMN IF NOT EXISTS "signup_close_time" text DEFAULT '16:00';
