import { execSync } from 'child_process';
import { neon } from '@neondatabase/serverless';

async function main() {
  // Prevent running on main branch in case of accidental preview evaluations
  if (process.env.VERCEL_GIT_COMMIT_REF === 'main') {
    console.log('⏭️ Skipping database setup: Cannot run on main branch.');
    return;
  }

  if (process.env.VERCEL_ENV === 'preview') {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy') || process.env.DATABASE_URL.includes('localhost')) {
      console.log('⏭️ Skipping database setup: DATABASE_URL is not configured for this preview build.');
      return;
    }

    console.log('🚧 Preview environment detected: Ensuring schema tables and running seed...');
    try {
      const sql = neon(process.env.DATABASE_URL);

      // Ensure match_games table and index exist
      await sql`
        CREATE TABLE IF NOT EXISTS "match_games" (
          "id" serial PRIMARY KEY NOT NULL,
          "match_id" integer NOT NULL REFERENCES "matches"("id") ON DELETE CASCADE,
          "game_number" integer NOT NULL,
          "team_one_score" integer NOT NULL,
          "team_two_score" integer NOT NULL,
          "created_at" timestamp DEFAULT now()
        );
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS "match_games_match_id_idx" ON "match_games" ("match_id");
      `;

      // Execute seed
      execSync('pnpm run db:seed', { stdio: 'inherit' });
      console.log('✅ Database setup for preview completed successfully.');
    } catch (error) {
      console.error('❌ Failed to setup database for preview:', error);
      // Exit with an error code to fail the build if DB setup fails
      process.exit(1);
    }
  } else {
    console.log(`⏭️ Skipping preview database setup (VERCEL_ENV=${process.env.VERCEL_ENV || 'undefined'})`);
  }
}

main().catch((err) => {
  console.error('Fatal error in preview setup:', err);
  process.exit(1);
});
