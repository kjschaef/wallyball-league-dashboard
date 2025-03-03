import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a temporary file with test files that DON'T use Jest
const createTestFileList = () => {
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const tempFile = path.join(tempDir, 'mocha-tests.txt');
  
  // For now, just include the sample test which we know works with Mocha
  fs.writeFileSync(tempFile, 'server/tests/sample.test.ts\n');
  
  return tempFile;
};

// Run mocha with the correct Node.js options for ES modules
// But only for the Mocha-compatible test files
console.log("Running Mocha tests...");
const testFilesPath = createTestFileList();

const result = spawnSync('npx', [
  'mocha',
  '--node-option=experimental-specifier-resolution=node',
  '--require=ts-node/register/transpile-only',
  '--timeout=10000',
  '--file=./server/tests/setup.ts',
  '--file-list', testFilesPath
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

// Clean up
fs.unlinkSync(testFilesPath);
if (fs.readdirSync(path.dirname(testFilesPath)).length === 0) {
  fs.rmdirSync(path.dirname(testFilesPath));
}

process.exit(result.status);