import { execSync } from 'child_process';

function main() {
  if (process.env.VERCEL_ENV === 'preview') {
    console.log('🚧 Preview environment detected: Running database migrations and seed...');
    try {
      // Execute the push and seed commands
      // stdio: 'inherit' will redirect the output to the Vercel build log
      execSync('pnpm run db:push', { stdio: 'inherit' });
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
