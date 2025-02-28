
// This file contains setup code that runs before tests

// Set environment to test to avoid database operations
process.env.NODE_ENV = 'test';

// Completely mock the database module to prevent any actual database connections
jest.mock('../../db', () => ({
  db: {
    query: jest.fn().mockResolvedValue([]),
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          execute: jest.fn().mockResolvedValue([])
        })
      })
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockReturnValue({
          execute: jest.fn().mockResolvedValue([])
        })
      })
    }),
    delete: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        execute: jest.fn().mockResolvedValue([])
      })
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          execute: jest.fn().mockResolvedValue([])
        })
      })
    })
  }
}));

// Also mock the database config to prevent any connection initialization
jest.mock('../../db/config', () => ({
  getEnvironment: jest.fn().mockReturnValue('test'),
  getDatabase: jest.fn().mockImplementation(() => {
    // Return a mock rather than trying to connect
    return {
      query: jest.fn().mockResolvedValue([]),
      // Add other methods as needed for tests
    };
  })
}));

// Speed up tests by mocking timers
jest.useFakeTimers();
