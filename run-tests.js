import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get test file path from command line arguments
const testFile = process.argv[2] || 'server/tests/sample.test.ts';

// Check if the file exists before attempting to run it
if (!fs.existsSync(testFile)) {
  console.error(`Error: Test file '${testFile}' does not exist.`);
  process.exit(1);
}

console.log(`Running test file: ${testFile}`);

// Run mocha with the correct Node.js options for ES modules
// Disable TypeScript type checking for tests (--transpile-only)
const result = spawnSync('npx', [
  'mocha',
  '--node-option=experimental-specifier-resolution=node',
  '--require=ts-node/register/transpile-only',
  '--timeout=10000',
  '--file=./server/tests/setup.ts',
  testFile
], {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_ENV: 'test',
    TS_NODE_TRANSPILE_ONLY: 'true',
    TS_NODE_PROJECT: './tsconfig.json',
    TS_NODE_COMPILER_OPTIONS: '{"esModuleInterop":true,"resolveJsonModule":true}'
  }
});

process.exit(result.status);