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

// Create a more accurate representation of the Drizzle ORM structure
// The actual db object has methods like db.select().from() and chained methods
export const db = {
  // Core query methods
  select: sandbox.stub().returnsThis(),
  insert: sandbox.stub().returnsThis(),
  update: sandbox.stub().returnsThis(),
  delete: sandbox.stub().returnsThis(),
  
  // Chaining methods
  from: sandbox.stub(),
  where: sandbox.stub().returnsThis(),
  set: sandbox.stub().returnsThis(),
  values: sandbox.stub().returnsThis(),
  returning: sandbox.stub(),
  
  // Additional methods
  leftJoin: sandbox.stub().returnsThis(),
  rightJoin: sandbox.stub().returnsThis(),
  innerJoin: sandbox.stub().returnsThis(),
  groupBy: sandbox.stub().returnsThis(),
  orderBy: sandbox.stub().returnsThis(),
  limit: sandbox.stub().returnsThis(),
  offset: sandbox.stub().returnsThis()
};

// Define database operation methods to stub
const dbMethods = [
  'select', 'from', 'where', 'insert', 'update', 'delete',
  'values', 'set', 'returning', 'leftJoin', 'rightJoin',
  'innerJoin', 'groupBy', 'orderBy', 'limit', 'offset'
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
    if (method === 'from' || method === 'returning') {
      // These methods might resolve to data instead of continuing the chain
      db[method].resolves([]);
    } else {
      // Most methods return the db object for chaining
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