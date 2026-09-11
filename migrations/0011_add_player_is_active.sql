ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "players_is_active_idx" ON "players" USING btree ("is_active");--> statement-breakpoint
UPDATE "players" SET "is_active" = false WHERE "deleted_at" IS NOT NULL;
