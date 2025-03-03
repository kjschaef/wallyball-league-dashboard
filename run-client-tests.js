#!/usr/bin/env node

/**
 * Helper script to run just the client tests with fixed configuration
 */

import { spawnSync } from 'child_process';

console.log(`\n🧪 Running client tests with fixed configuration...\n`);

// Execute Jest with only client tests using our fixed config
const result = spawnSync('npx', [
  'jest',
  '--config=jest.client.fixed.config.js',
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