# Volleyball League Manager - Testing Guide

This directory contains tests for the Volleyball League Manager API endpoints. The tests are written using Mocha and Chai, with additional tools like Sinon for mocking/stubbing.

## Testing Philosophy

The testing approach follows these principles:

1. **Isolation**: Tests run in isolation without affecting the production database.
2. **Speed**: Tests are designed to run quickly without external dependencies.
3. **Completeness**: API endpoints have comprehensive test coverage.
4. **Maintainability**: Tests are organized by domain area for easy maintenance.

## Test Structure

The test files are organized by domain area:

- `players.test.ts`: Tests for player-related endpoints
- `matches.test.ts`: Tests for match recording and retrieval
- `achievements.test.ts`: Tests for player achievements
- `trends.test.ts`: Tests for performance trend data

## Running Tests

To run all tests:

```bash
node run-tests.js
```

To run a specific test file:

```bash
npx mocha server/tests/players.test.ts
```

## Test Utilities

The `testUtils.ts` file provides common utilities for testing:

- `createTestApp()`: Creates an Express app with all routes registered
- `stubMethod()`: Creates a Sinon stub and tracks it for later restoration
- `resetStubs()`: Resets all stubs between tests (equivalent to Jest's `resetMocks`)
- `expect`: Chai assertion library exported for convenience
- `request`: Chai HTTP request utility for testing API endpoints

## Writing Tests

When writing a new test:

1. Import required utilities:
   ```typescript
   import { expect, request, createTestApp, resetStubs } from "./testUtils.js";
   ```

2. Use the Mocha `describe` and `it` functions for test organization:
   ```typescript
   describe("Player API", () => {
     // Reset stubs between tests
     afterEach(() => {
       resetStubs();
     });

     it("should return all players", async () => {
       // Test implementation
     });
   });
   ```

3. Use Chai's assertion library:
   ```typescript
   expect(response.status).to.equal(200);
   expect(response.body).to.be.an("array");
   ```

4. Use Sinon for mocking database operations:
   ```typescript
   // Mock db.select().from().where()... chain
   // The test setup handles this automatically for most cases
   ```

## Test Database

Tests use a mocked database layer to avoid affecting any real database. The mocking is set up in `setup.ts` and automatically applied to all tests.