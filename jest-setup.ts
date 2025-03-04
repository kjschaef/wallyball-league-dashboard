// Import jest-dom for DOM testing utilities
import '@testing-library/jest-dom';

// Mock objects and global values needed for tests
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Add any other global mocks or setup code here