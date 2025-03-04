// Import jest-dom for DOM testing utilities
import '@testing-library/jest-dom';

// Mock objects and global values needed for tests
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Add any other global mocks needed for all tests here