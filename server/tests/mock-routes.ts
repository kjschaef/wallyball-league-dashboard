/**
 * Mock routes file for testing that avoids using aliased imports
 * This simulates the structure of server/routes.ts but with direct imports
 */
import type { Express } from "express";
import { createServer, type Server } from "http";

// Mock routes file just for testing
export function registerRoutes(app: Express): Server {
  // Very simple mock server with no routes for testing
  const server = createServer(app);
  return server;
}