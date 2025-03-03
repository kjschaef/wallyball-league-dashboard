import { spawnSync } from 'child_process';

// Run mocha with the correct Node.js options for ES modules
// Disable TypeScript type checking for tests (--transpile-only)
const result = spawnSync('node', [
  '--experimental-specifier-resolution=node',
  '--loader=ts-node/esm',
  './node_modules/mocha/bin/mocha.js',
  '--require', 'ts-node/register/transpile-only',
  'server/tests/**/*.test.ts'
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'test',
    TS_NODE_TRANSPILE_ONLY: 'true'
  }
});

process.exit(result.status);