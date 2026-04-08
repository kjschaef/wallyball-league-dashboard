import { execSync } from 'child_process';

function main() {
  if (process.env.VERCEL_ENV === 'preview') {
    console.log('🚧 Preview environment detected: Running database migrations and seed...');
    try {
      // Execute the push and seed commands
      // Use --force for db:push to automatically accept data loss warnings since Vercel has no TTY
      execSync('pnpm exec drizzle-kit push --force', { stdio: 'inherit' });
      execSync('pnpm run db:seed', { stdio: 'inherit' });
      console.log('✅ Database setup for preview completed successfully.');
    } catch (error) {
      console.error('❌ Failed to setup database for preview:', error);
      // Exit with an error code to optionally fail the build if DB setup fails
      process.exit(1);
    }
  } else {
    console.log(`⏭️ Skipping preview database setup (VERCEL_ENV=${process.env.VERCEL_ENV || 'undefined'})`);
  }
}

main();
