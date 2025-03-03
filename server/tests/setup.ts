/**
 * Jest setup file to configure the test environment
 * 
 * This file runs before each test file, setting up global mocks and configurations
 */
import { jest } from '@jest/globals';

// Mock the database connection and operations
jest.mock('../../../db/index.ts', () => {
  // This lets us control what db operations return in tests
  return {
    db: {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      eq: jest.fn(),
      or: jest.fn(),
      and: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([]),
    },
  };
});

// Set up environment variables for testing
process.env.NODE_ENV = 'test';

// Global test timeout (optional)
jest.setTimeout(10000);