// Bridge script to start Next.js application
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

console.log('Starting Next.js application...');

try {
  // Verify app directory exists
  const appDir = path.resolve('./app');
  if (!existsSync(appDir)) {
    throw new Error('App directory not found at: ' + appDir);
  }
  
  console.log('Using Next.js app located at:', appDir);
  
  // Install required dependencies if needed
  execSync('cd app && npm install next react react-dom --no-save', { stdio: 'inherit' });
  
  // Create the proper Next.js structure if it doesn't exist
  if (!existsSync(path.join(appDir, 'pages')) && !existsSync(path.join(appDir, 'app'))) {
    console.log('Creating Next.js app directory structure...');
    execSync('mkdir -p app/app', { stdio: 'inherit' });
    
    // Copy existing page to app directory
    if (existsSync(path.join(appDir, 'page.tsx'))) {
      execSync('cp app/page.tsx app/app/', { stdio: 'inherit' });
    }
    
    // Copy layout to app directory
    if (existsSync(path.join(appDir, 'layout.tsx'))) {
      execSync('cp app/layout.tsx app/app/', { stdio: 'inherit' });
    }
    
    // Copy globals.css to app directory
    if (existsSync(path.join(appDir, 'globals.css'))) {
      execSync('cp app/globals.css app/app/', { stdio: 'inherit' });
    }
  }
  
  // Run Next.js dev server from the app directory
  process.chdir(appDir);
  execSync('npx next dev --port 5000', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to start Next.js application:', error);
  process.exit(1);
}