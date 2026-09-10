ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "players_deleted_at_idx" ON "players" USING btree ("deleted_at");
