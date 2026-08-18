import { execSync } from 'child_process';

function main() {
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

    console.log('🚧 Preview environment detected: Running database migrations and seed...');
    try {
      // Execute migrations first to avoid interactive prompt during drizzle-kit push
      try {
        execSync('pnpm exec drizzle-kit migrate', { stdio: 'inherit' });
      } catch {
        // Fallback to push with force if migrate is already up to date
        execSync('pnpm exec drizzle-kit push --force', { stdio: 'inherit' });
      }

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

main();
