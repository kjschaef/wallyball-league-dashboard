# API Unit Testing Guide

## Overview

This folder contains unit tests for the volleyball league management API endpoints. These tests are designed to run fast and locally, without affecting the production database.

## Testing Approach

The tests follow these best practices:

1. **Isolation**: Each test is independent and doesn't rely on the state from other tests.
2. **Mocking**: Database operations are mocked to avoid touching the actual database.
3. **Speed**: Tests are designed to run quickly by avoiding real network or database operations.
4. **Coverage**: Tests cover happy paths as well as error scenarios.
5. **Readability**: Tests are structured with clear assertions and descriptions.

## Test Structure

- `setup.ts` - Jest setup file that configures global mocks
- `testUtils.ts` - Helper utilities for test setup and teardown
- `players.test.ts` - Tests for player management endpoints
- `matches.test.ts` - Tests for game/match management endpoints
- `trends.test.ts` - Tests for performance trends reporting
- `achievements.test.ts` - Tests for player achievements

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests with coverage report

```bash
npm test -- --coverage
```

### Run specific test file

```bash
npm test -- server/tests/players.test.ts
```

### Run tests in watch mode (for development)

```bash
npm test -- --watch
```

## Mocking Strategy

We use Jest's mocking capabilities to isolate our tests from external dependencies:

1. **Database Mocking**: All database operations are mocked in `setup.ts` to return predictable responses
2. **date-fns**: Date utility functions are mocked in specific tests to provide consistent date handling
3. **Express**: We use supertest to simulate HTTP requests without actually starting a server

## Adding New Tests

When adding new API endpoints, please follow these guidelines for testing:

1. Create a new test file if it's a completely new feature area
2. Add mock data that represents realistic database responses
3. Test both successful operations and error handling
4. Verify that the correct database operations are called with the right parameters
5. Test edge cases and validation logic