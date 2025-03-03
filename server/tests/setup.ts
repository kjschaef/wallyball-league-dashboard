/**
 * Mocha setup file to configure the test environment
 * 
 * This file runs before each test file, setting up global stubs and configurations
 */
import sinon from 'sinon';

// Set up environment variables for testing
process.env.NODE_ENV = 'test';

// Create a sandbox for managing stubs
const sandbox = sinon.createSandbox();

// Mock the database module that will be imported in the tests
// This matches the structure used in routes.ts: db.select().from(players)
export const db = {
  select: sandbox.stub().returnsThis(),
  insert: sandbox.stub().returnsThis(),
  update: sandbox.stub().returnsThis(),
  delete: sandbox.stub().returnsThis(),
  from: sandbox.stub().returnsThis(),
  where: sandbox.stub().returnsThis(),
  set: sandbox.stub().returnsThis(),
  values: sandbox.stub().returnsThis(),
  returning: sandbox.stub().resolves([])
};

// Define database operation methods to stub
const dbMethods = [
  'select', 'from', 'where', 'insert', 'update', 
  'delete', 'values', 'set', 'returning'
] as const;

type DbStub = {
  [K in typeof dbMethods[number]]: sinon.SinonStub;
};

/**
 * Setup database stubs that can be configured in individual tests
 * Returns the stubbed methods for configuration in tests
 */
export function setupDbStubs(): DbStub {
  // Reset the stubs to their default behavior
  dbMethods.forEach(method => {
    if (method === 'returning') {
      db[method].resolves([]);
    } else {
      db[method].returnsThis();
    }
  });

  return db as unknown as DbStub;
}

/**
 * Reset all stubs to their original state
 */
export function resetStubs(): void {
  sandbox.reset();
}

// Mocha hooks for setup and teardown
export const mochaHooks = {
  beforeEach(): void {
    setupDbStubs();
  },
  
  afterEach(): void {
    resetStubs();
  }
};