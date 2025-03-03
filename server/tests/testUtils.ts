/**
 * Test utilities for API testing
 */
import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../routes';

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
 * Reset all mocks between tests
 */
export function resetMocks() {
  jest.clearAllMocks();
}