/**
 * Mocha setup file to configure the test environment
 * 
 * This file runs before each test file, setting up global stubs and configurations
 */
import sinon from 'sinon';
import { db } from '../../db/index.js';

// Set up environment variables for testing
process.env.NODE_ENV = 'test';

// Create a sandbox for managing stubs
const sandbox = sinon.createSandbox();

// Define database operation methods to stub
const dbMethods = [
  'select', 'from', 'where', 'eq', 'or', 'and', 
  'insert', 'update', 'delete', 'values', 'set', 'returning'
] as const;

// Create a type for the database stub
type DbStub = {
  [K in typeof dbMethods[number]]: sinon.SinonStub;
};

// Setup stubs for database operations
export function setupDbStubs(): DbStub {
  // Create stubs for database methods
  const dbStub: Partial<DbStub> = {};
  
  // Create individual stubs
  dbMethods.forEach(method => {
    // Create a stub that returns itself for chainable methods, or resolves to empty array for terminating methods
    if (method === 'returning') {
      dbStub[method] = sandbox.stub().resolves([]);
    } else {
      dbStub[method] = sandbox.stub().returnsThis();
    }
  });

  // Apply the stubs to the actual db object where those methods exist
  dbMethods.forEach(method => {
    if (typeof db[method as keyof typeof db] === 'function') {
      // @ts-ignore - The typing here is complex due to the dynamic nature of stubbing
      sandbox.stub(db, method).callsFake(function(this: any, ...args: any[]) {
        return dbStub[method]?.apply(this, args);
      });
    }
  });

  return dbStub as DbStub;
}

// Reset all stubs
export function resetStubs(): void {
  sandbox.restore();
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