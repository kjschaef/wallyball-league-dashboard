#!/usr/bin/env node

/**
 * Fast Jest Test Runner
 * 
 * This script provides options for running tests with optimized performance.
 * 
 * Usage:
 *   node test-runner.js [options]
 * 
 * Options:
 *   --fast         Run tests in parallel with minimal overhead (default)
 *   --debug        Run tests in sequence for easier debugging
 *   --client       Run only client tests
 *   --server       Run only server tests
 *   --watch        Run tests in watch mode (auto re-run on file changes)
 *   --file <path>  Run tests for a specific file
 */

import { spawnSync } from 'child_process';

// Parse command-line arguments
const args = process.argv.slice(2);
const options = {
  fast: !args.includes('--debug'),
  client: args.includes('--client'),
  server: args.includes('--server'),
  watch: args.includes('--watch'),
  file: args.includes('--file') ? args[args.indexOf('--file') + 1] : null
};

// If neither client nor server is specified, run both
if (!options.client && !options.server) {
  options.client = true;
  options.server = true;
}

// Build Jest command
let jestCommand = ['npx', 'jest'];

// Add test selectors
const testSelectors = [];
if (options.client) testSelectors.push('client');
if (options.server) testSelectors.push('server');
if (testSelectors.length > 0) {
  jestCommand.push(`--selectProjects=${testSelectors.join(',')}`);
}

// Add specific file if requested
if (options.file) {
  jestCommand.push(options.file);
}

// Add performance options
if (options.fast) {
  jestCommand.push('--maxWorkers=50%');
} else {
  jestCommand.push('--runInBand'); // Run tests in sequence for debugging
}

// Add watch mode if requested
if (options.watch) {
  jestCommand.push('--watch');
}

// Always use cache for speed unless explicitly disabled
if (!args.includes('--no-cache')) {
  jestCommand.push('--cache');
}

// Print command being executed
console.log(`\nExecuting: ${jestCommand.join(' ')}\n`);

// Run Jest
const result = spawnSync(jestCommand[0], jestCommand.slice(1), { 
  stdio: 'inherit',
  env: {
    ...process.env,
    // Additional performance env variables
    NODE_ENV: 'test',
    // Disable logging during tests
    DEBUG: '',
  }
});

// Exit with the same code as the Jest process
process.exit(result.status);