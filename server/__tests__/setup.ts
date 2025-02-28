
// This file contains setup code that runs before tests

// Set environment to test to avoid database operations if possible
process.env.NODE_ENV = 'test';

// Mock database connection for faster tests
jest.mock('../../db/config', () => ({
  getEnvironment: jest.fn().mockReturnValue('test'),
  getDatabase: jest.fn().mockReturnValue({
    // Add minimal mock implementations needed by tests
    query: jest.fn().mockResolvedValue([]),
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          execute: jest.fn().mockResolvedValue([])
        })
      })
    })
  })
}));

// Speed up tests by mocking timers
jest.useFakeTimers();
