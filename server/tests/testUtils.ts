/**
 * Test utilities for API testing with Mocha and Chai
 */
import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../routes.js';
import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';

// Configure Chai
chai.use(chaiHttp);

// Export testing libraries for convenience
export const { expect } = chai;
export const request = chai.request;

// Store stubs for later reset
const stubs = new Map();

/**
 * Creates a test Express app instance with routes registered
 */
export function createTestApp() {
  const app = express();
  app.use(express.json());
  
  // Register all routes from the application
  const server = registerRoutes(app);
  
  return { app, server };
}

/**
 * Create a stub for an object's method and store it for later restoration
 */
export function stubMethod(object, method) {
  const stubKey = `${object.constructor?.name || 'anonymous'}.${method}`;
  const newStub = sinon.stub(object, method);
  stubs.set(stubKey, newStub);
  return newStub;
}

/**
 * Reset all stubs between tests
 */
export function resetStubs() {
  stubs.forEach(stub => {
    if (stub.restore) {
      stub.restore();
    }
  });
  stubs.clear();
}