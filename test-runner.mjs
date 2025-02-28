#!/usr/bin/env node

/**
 * Fast Jest Test Runner
 * 
 * This script provides options for running tests with optimized performance.
 * 
 * Usage:
 *   node test-runner.mjs [options]
 * 
 * Options:
 *   --fast         Run tests in parallel with minimal overhead (default)
 *   --debug        Run tests in sequence for easier debugging
 *   --client       Run only client tests
 *   --server       Run only server tests
 *   --watch        Run tests in watch mode (auto re-run on file changes)
 *   --file <path>  Run tests for a specific file
 *   --coverage     Run tests with coverage reports
 */

import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);

// Available configurations
const CLIENT_TESTS = 'client/src/**/*.test.{ts,tsx}';
const SERVER_TESTS = 'server/**/*.test.ts';
const ALL_TESTS = '{client/src,server}/**/*.test.{ts,tsx}';

// Determine test configuration
const isDebug = hasFlag('--debug');
const isWatch = hasFlag('--watch');
const isCoverage = hasFlag('--coverage');
const isClient = hasFlag('--client');
const isServer = hasFlag('--server');

// Get specific file path if provided
const fileIndex = args.indexOf('--file');
const specificFile = fileIndex !== -1 ? args[fileIndex + 1] : null;

// Determine test pattern
let testPattern = ALL_TESTS;
if (isClient) testPattern = CLIENT_TESTS;
if (isServer) testPattern = SERVER_TESTS;
if (specificFile) testPattern = specificFile;

// Build Jest command
const jestArgs = [
  'jest',
  testPattern,
  '--config=jest.config.ts',
  isWatch ? '--watch' : '',
  isCoverage ? '--coverage' : '',
  isDebug ? '--runInBand' : '--maxWorkers=50%',
  '--colors',
  '--verbose',
];

// Filter out empty strings
const filteredArgs = jestArgs.filter(Boolean);

console.log(`\n🧪 Running tests with the following configuration:`);
console.log(`   - Mode: ${isDebug ? 'Debug (sequential)' : 'Fast (parallel)'}`);
console.log(`   - Tests: ${specificFile ? `File ${specificFile}` : isClient ? 'Client only' : isServer ? 'Server only' : 'All'}`);
console.log(`   - Coverage: ${isCoverage ? 'Yes' : 'No'}`);
console.log(`   - Watch mode: ${isWatch ? 'Yes' : 'No'}`);
console.log(`\n   npx ${filteredArgs.join(' ')}\n`);

// Execute Jest with the configured arguments
const result = spawnSync('npx', filteredArgs, { 
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
});

// Handle errors
if (result.error) {
  console.error(`\n❌ Error running tests: ${result.error.message}`);
  process.exit(1);
}

// Exit with the same code as Jest
process.exit(result.status);