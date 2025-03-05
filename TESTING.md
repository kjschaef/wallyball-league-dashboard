# Testing Infrastructure

This document provides an overview of the testing infrastructure for the Volleyball League Management Platform.

## Overview

The project uses Mocha as the test runner with Chai for assertions and Sinon for mocking. The tests are organized into separate directories for different aspects of the application:

- `test/db`: Tests for database operations
- `test/server`: Tests for API endpoints
- `test/client`: Tests for React components
- `test/utils.test.ts`: Tests for utility functions

## Running Tests

To run tests, use the `run-tests.sh` script:

```bash
# Run all tests
./run-tests.sh all

# Run only database tests
./run-tests.sh db

# Run only server API tests
./run-tests.sh server

# Run only client component tests
./run-tests.sh client

# Run only utility tests
./run-tests.sh utils

# Run tests in watch mode
./run-tests.sh watch
```

## Test Structure

### Database Tests

Database tests in `test/db` focus on testing database operations using mocks to avoid real database interactions. These tests use Sinon to mock the Drizzle ORM methods.

Example:
```typescript
describe('Player Database Operations', () => {
  it('should return a player when found', async () => {
    // Mock database and test player data retrieval
  });
});
```

### API Tests

API tests in `test/server` test the Express routes using Supertest to make requests to the API endpoints. These tests also mock the database to focus on testing the route handlers.

Example:
```typescript
describe('GET /api/players', () => {
  it('should return all players', async () => {
    // Make a request to the API and verify the response
  });
});
```

### React Component Tests

React component tests in `test/client` use React Testing Library to render components and test their behavior. These tests focus on the user interaction with components.

Example:
```typescript
describe('<StatCard />', () => {
  it('should render the title and value correctly', () => {
    // Render the component and test its content
  });
});
```

### Utility Tests

Utility tests in `test/utils.test.ts` test general utility functions used throughout the application.

Example:
```typescript
describe('cn (class name utility)', () => {
  it('should combine multiple class names', () => {
    // Test utility function behavior
  });
});
```

## Configuration Files

- `.mocharc.json`: Mocha configuration file
- `tsconfig.json`: TypeScript configuration with appropriate test settings
- `test/setup.ts`: Setup file for JSDOM and global test environment

## Best Practices

1. **Use Mocks for External Services**: Always mock database calls, API requests, and other external services.
2. **Test Behavior, Not Implementation**: Focus on testing what components and functions do, not how they do it.
3. **Write Isolated Tests**: Each test should be independent and not rely on other tests.
4. **Use Descriptive Test Names**: Test descriptions should clearly explain what's being tested.
5. **Keep Tests Fast**: Tests should run quickly to provide rapid feedback.

## Adding New Tests

1. Create a new test file in the appropriate directory.
2. Import necessary testing utilities.
3. Write test cases using the `describe` and `it` functions.
4. Run the tests to ensure they pass.

Example of a new test file:
```typescript
import { expect } from 'chai';

describe('Feature Name', () => {
  it('should behave in a specific way', () => {
    // Test code
    expect(result).to.equal(expectedValue);
  });
});
```