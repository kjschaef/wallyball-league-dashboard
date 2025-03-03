#!/usr/bin/env node

/**
 * Simple script to run client tests
 */
const { execSync } = require('child_process');

try {
  console.log('\n🧪 Running client tests...\n');
  
  // Set NODE_ENV to test for proper Jest environment
  process.env.NODE_ENV = 'test';
  
  // Run Jest with our client configuration
  execSync('npx jest --config=jest.client.config.js --colors', { 
    stdio: 'inherit'
  });
  
  console.log('\n✅ Client tests completed successfully!\n');
} catch (error) {
  console.error('\n❌ Client tests failed\n');
  process.exit(1);
}