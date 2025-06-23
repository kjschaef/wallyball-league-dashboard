
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'lib', 'mcp-server.ts');

console.log('Starting Wallyball Rules MCP Server...');

const server = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

server.on('close', (code) => {
  console.log(`MCP server exited with code ${code}`);
});

server.on('error', (error) => {
  console.error('Failed to start MCP server:', error);
});

process.on('SIGINT', () => {
  console.log('Shutting down MCP server...');
  server.kill('SIGINT');
});
