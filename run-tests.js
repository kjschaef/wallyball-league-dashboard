#!/usr/bin/env node

/**
 * Simple Jest Test Runner
 * Usage: node run-tests.js [client|server|all]
 */

import { spawnSync } from 'child_process';

// Parse command line args
const args = process.argv.slice(2);
const testScope = args[0] || 'all';

// Determine what tests to run
let testPattern;
switch (testScope) {
  case 'client':
    testPattern = 'client/src/__tests__/**/*.test.{ts,tsx}';
    break;
  case 'server':
    testPattern = 'server/__tests__/**/*.test.ts';
    break;
  case 'all':
  default:
    testPattern = '{client/src,server}/__tests__/**/*.test.{ts,tsx}';
}

console.log(`\n🧪 Running ${testScope} tests...\n`);

// Execute Jest
const result = spawnSync('npx', [
  'jest',
  testPattern,
  '--config=jest.config.ts',
  '--colors',
], { 
  stdio: 'inherit',
  shell: true 
});

// Handle errors
if (result.error) {
  console.error(`\n❌ Error running tests: ${result.error.message}`);
  process.exit(1);
}

// Exit with the same code as Jest
process.exit(result.status);