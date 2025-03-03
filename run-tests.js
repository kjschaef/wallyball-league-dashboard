import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Run mocha with the correct Node.js options for ES modules
// Disable TypeScript type checking for tests (--transpile-only)
const result = spawnSync('npx', [
  'mocha',
  '--node-option=experimental-specifier-resolution=node',
  '--require=ts-node/register/transpile-only',
  '--ignore-file=node_modules/**',
  '--extensions=ts',
  '--timeout=10000',
  '--file=./server/tests/setup.ts',
  'server/tests/**/*.test.ts'
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