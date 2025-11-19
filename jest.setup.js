// Jest global setup for tests
// - ensure tests have a DATABASE_URL so route handlers that check it don't throw
// - provide a lightweight mock for @neondatabase/serverless so tests can spy on it

process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'test';
// Do NOT set process.env.DATABASE_URL here — some tests verify behavior when it's missing.

// Note: We provide a manual in-memory mock implementation under
// `__mocks__/@neondatabase/serverless.js`. Tests can still override the module
// with `jest.mock()` if they need to customize behavior per-test.

// Silence expected console.error logs in tests unless tests fail explicitly
const originalConsoleError = console.error;
console.error = (...args) => {
  // Allow tests to show errors, but prefix with [jest] so it's easier to filter
  originalConsoleError('[jest]', ...args);
};
