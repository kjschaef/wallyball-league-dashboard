ALTER TABLE "players" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "sms_opt_in" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "sms_reminders_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "sms_reminders_day_of_week" integer DEFAULT 3;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "sms_reminders_time" text DEFAULT '12:00';