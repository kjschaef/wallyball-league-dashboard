// Import jest-dom for DOM testing utilities
import '@testing-library/jest-dom';

// Mock objects and global values needed for tests
global.ResizeObserver = function() {
  return {
    observe: function() {},
    unobserve: function() {},
    disconnect: function() {}
  };
};

// Add any other global mocks needed for all tests here