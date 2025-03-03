import { spawnSync } from 'child_process';

// Run mocha with the correct Node.js options for ES modules
const result = spawnSync('node', [
  '--experimental-specifier-resolution=node',
  '--loader=ts-node/esm',
  './node_modules/mocha/bin/mocha.js',
  'server/tests/**/*.test.ts'
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'test'
  }
});

process.exit(result.status);