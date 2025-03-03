/**
 * Test utilities for API testing with Mocha and Chai
 */
import express, { Express } from 'express';
import { Server } from 'http';
import { registerRoutes } from './mock-routes.js';
import sinon from 'sinon';
import * as chai from 'chai';
import chaiHttp from 'chai-http';

// Configure Chai
chai.use(chaiHttp);

// Export testing libraries for convenience
export const { expect } = chai;
// Create a type-safe request function
// @ts-ignore - Chai HTTP extends chai with the request method
export const request = chai.request;

// Store stubs for later reset
const stubs = new Map<string, sinon.SinonStub<any[], any>>();

/**
 * Creates a test Express app instance with routes registered
 */
export function createTestApp(): { app: Express, server: Server } {
  const app = express();
  app.use(express.json());
  
  // Register all routes from the application
  const server = registerRoutes(app);
  
  return { app, server };
}

/**
 * Create a stub for an object's method and store it for later restoration
 * @param object - The object containing the method to stub
 * @param method - The name of the method to stub
 * @returns The created sinon stub
 */
export function stubMethod<T extends object, K extends keyof T>(
  object: T, 
  method: K & string
): sinon.SinonStub<any[], any> {
  const stubKey = `${object.constructor?.name || 'anonymous'}.${method}`;
  // Using any here due to complex typing with sinon stubs
  const newStub = sinon.stub(object, method as any);
  stubs.set(stubKey, newStub);
  return newStub;
}

/**
 * Reset all stubs between tests
 * This is the equivalent of the Jest resetMocks function
 */
export function resetStubs(): void {
  stubs.forEach(stub => {
    if (stub.restore) {
      stub.restore();
    }
  });
  stubs.clear();
}

/**
 * For backward compatibility with Jest tests
 * Use this when transitioning from jest.clearAllMocks()
 */
export const resetMocks = resetStubs;