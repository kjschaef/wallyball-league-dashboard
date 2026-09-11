import { execSync } from 'child_process';
import { neon } from '@neondatabase/serverless';

async function main() {
  // Production environment: apply database migrations
  if (process.env.VERCEL_ENV === 'production') {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy') || process.env.DATABASE_URL.includes('localhost')) {
      console.log('⏭️ Skipping database migrations: DATABASE_URL is not configured for production build.');
      return;
    }

    console.log('🚀 Production environment detected: Applying pending database migrations...');
    try {
      execSync('pnpm run db:migrate', { stdio: 'inherit' });
      console.log('✅ Production database migrations applied successfully.');
      return;
    } catch (error) {
      console.error('❌ Failed to apply migrations to production database:', error);
      process.exit(1);
    }
  }

  // Prevent running preview setup on main branch in case of accidental preview evaluations
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

      // Drop any orphaned legacy tables that break foreign keys on seed
      await sql`DROP TABLE IF EXISTS "player_achievements" CASCADE;`;
      await sql`DROP TABLE IF EXISTS "achievements" CASCADE;`;

      // Apply pending migrations to preview database branch
      execSync('pnpm run db:migrate', { stdio: 'inherit' });

      // Execute seed
      execSync('pnpm run db:seed', { stdio: 'inherit' });
      console.log('✅ Database setup for preview completed successfully.');
    } catch (error) {
      console.error('❌ Failed to setup database for preview:', error);
      // Exit with an error code to fail the build if DB setup fails
      process.exit(1);
    }
  } else {
    console.log(`⏭️ Skipping database setup (VERCEL_ENV=${process.env.VERCEL_ENV || 'undefined'})`);
  }
}

main().catch((err) => {
  console.error('Fatal error in preview setup:', err);
  process.exit(1);
});
