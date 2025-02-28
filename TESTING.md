# Volleyball Stats Testing Guide

This document explains how to use the optimized test runner for the volleyball stats application.

## Test Runner Usage

Our custom test runner provides various options for running tests with optimized performance:

```bash
node test-runner.mjs [options]
```

### Options

- `--fast` - Run tests in parallel with minimal overhead (default)
- `--debug` - Run tests in sequence for easier debugging
- `--client` - Run only client tests
- `--server` - Run only server tests
- `--watch` - Run tests in watch mode (auto re-run on file changes)
- `--file <path>` - Run tests for a specific file

### Examples

Run all tests with optimal performance:
```bash
node test-runner.mjs
```

Run only client tests:
```bash
node test-runner.mjs --client
```

Run only server tests:
```bash
node test-runner.mjs --server
```

Debug mode (tests run sequentially):
```bash
node test-runner.mjs --debug
```

Watch mode (auto-rerun tests on file changes):
```bash
node test-runner.mjs --watch
```

Test a specific file:
```bash
node test-runner.mjs --file client/src/__tests__/team-stats.test.tsx
```

## Performance Testing

The client test suite includes performance benchmark tests in `client/src/__tests__/perf-test.test.tsx` that measure the execution time of critical functions like team formatting.

Run performance tests:
```bash
node test-runner.mjs --file client/src/__tests__/perf-test.test.tsx
```

## Testing Best Practices

1. **Unit Tests**: Focus on testing individual functions/components in isolation
2. **Mock Data**: All tests should use mock data instead of connecting to the real database
3. **Fast Execution**: Tests should run quickly to support rapid development
4. **Independent Tests**: Each test should be independent and not rely on the state from other tests

## Test Structure

- `client/src/__tests__/` - Client-side React component and utility tests
- `server/__tests__/` - Server-side API and utility tests
- `client/src/__mocks__/` - Mock implementations for assets (images, stylesheets)

## Troubleshooting

If tests are failing, try running in debug mode with:
```bash
node test-runner.mjs --debug
```

This will execute tests sequentially and make stack traces easier to read.