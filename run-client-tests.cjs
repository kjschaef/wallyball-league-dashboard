#!/usr/bin/env node

/**
 * Helper script to run just the client tests with fixed configuration
 */

const { spawnSync } = require('child_process');

console.log(`\n🧪 Running client tests with fixed configuration...\n`);

// Execute Jest with only client tests using our fixed config
const result = spawnSync('node', [
  '--experimental-vm-modules',
  'node_modules/jest/bin/jest.js',
  '--config=jest.client.fixed.config.mjs',
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