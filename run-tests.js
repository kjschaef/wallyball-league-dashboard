#!/usr/bin/env node

/**
 * Simple Jest Test Runner
 * Usage: node run-tests.js [client|server|all]
 */

import { spawnSync } from 'child_process';

// Parse command line args
const args = process.argv.slice(2);
const testScope = args[0] || 'all';

console.log(`\n🧪 Running ${testScope} tests...\n`);

// Execute Jest
const result = spawnSync('npx', [
  'jest',
  '--config=jest.config.cjs',
  '--selectProjects', testScope,
  '--colors',
  '--no-cache',
], { 
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'test'
  }
});

// Handle errors
if (result.error) {
  console.error(`\n❌ Error running tests: ${result.error.message}`);
  process.exit(1);
}

// Exit with the same code as Jest
process.exit(result.status);