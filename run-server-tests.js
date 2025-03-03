#!/usr/bin/env node

/**
 * Helper script to run just the server tests
 */

import { spawnSync } from 'child_process';

console.log(`\n🧪 Running server tests...\n`);

// Execute Jest with only server tests
const result = spawnSync('npx', [
  'jest',
  '--config=jest.config.cjs',
  '--selectProjects', 'server',
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