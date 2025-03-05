# Testing Infrastructure for Volleyball League Management Platform

This document provides an overview of the testing infrastructure and guidelines for the volleyball league management platform.

## Overview

The testing infrastructure is designed to be:

1. **Fast**: Tests run quickly to provide immediate feedback during development without timeout extensions
2. **Reliable**: Tests are deterministic and do not depend on external services when possible
3. **Maintainable**: Tests are well-structured and follow consistent patterns
4. **Modular**: Different components of the application can be tested in isolation

## Test Framework and Libraries

The project uses the following testing stack:

- **Mocha**: Test runner with ES module support
- **Chai**: Assertion library for expressive assertions
- **Sinon**: Mocking and stubbing library for isolating components
- **JSDOM**: For DOM simulation in Node.js environment
- **Testing Library**: For React component testing with user-centric approach
- **SuperTest**: For API endpoint testing

## Test Directory Structure

```
test/
├── client/                 # Frontend component tests
│   └── components/         # React component tests (PlayerSelector.test.tsx, etc.)
├── db/                     # Database tests
│   ├── mockDb.ts           # Mock database implementation for tests
│   └── player.test.ts      # Player model tests
├── server/                 # API and server tests
│   └── api.test.ts         # API endpoint tests
├── jsdom-setup.js          # JSDOM configuration for browser simulation
├── module-resolver.js      # Custom path alias resolution
├── setup-path-aliases.js   # Path alias configuration
├── setup.ts                # Global TypeScript test setup
├── simple.test.js          # Basic JavaScript test validation
├── utils.js                # Test utility functions
└── utils.test.ts           # TypeScript utility tests
```

## Configuration Files

- **.mocharc.json**: Mocha configuration (timeouts, extensions, etc.)
- **run-ts-tests.sh**: Script for running TypeScript tests with proper environment setup
- **run-tests.sh**: Script for running all tests

## Path Alias Resolution

The testing infrastructure supports path aliases (e.g., `@/components`, `@db/schema`) through a custom module resolution system:

1. **module-resolver.js**: Hooks into Node.js module loading system to resolve aliases
2. **setup-path-aliases.js**: Maps aliases to actual paths on the filesystem
3. **jsdom-setup.js**: Sets up the browser environment with alias support

Supported aliases:
- `@/`: Points to `client/src/`
- `@db/`: Points to `db/`
- `@test/`: Points to `test/`

## Running Tests

Tests can be run using the provided scripts:

```bash
# Run all tests
./run-ts-tests.sh

# Run specific test categories
./run-ts-tests.sh db         # Run database tests
./run-ts-tests.sh api        # Run API endpoint tests
./run-ts-tests.sh components # Run frontend component tests
./run-ts-tests.sh utils      # Run utility function tests
./run-ts-tests.sh js         # Run JavaScript tests only
```

## Test Environment Setup

### JSDOM Environment

For React component testing, we use JSDOM to simulate a browser environment with:

- DOM API (document, window, etc.)
- Event handling
- Browser-like behavior
- CSS support mocks
- Local storage mocks
- Media query simulation

### Mock Database

Database tests use a mock database implementation (`mockDb.ts`) that mimics Drizzle ORM behavior:

- In-memory data storage
- CRUD operations for all models
- Transaction support
- Relationship simulations

## Testing Strategies

### Database Testing

Database tests verify the correctness of:

- Schema definitions
- Query operations
- Data validation
- Error handling

Example: `test/db/player.test.ts`

### API Testing

API tests verify:

- Route handling
- Request validation
- Response formatting
- Error scenarios
- Authentication/authorization (when applicable)

Example: `test/server/api.test.ts`

### Component Testing

React component tests verify:

- Rendering correctness
- User interactions (clicks, inputs, etc.)
- Prop handling
- State management
- Event handling

Examples: `test/client/components/PlayerSelector.test.tsx`, `test/client/components/StatCard.test.tsx`

## Best Practices

1. **Independence**: Each test should be independent and not rely on the state from other tests
2. **Mocking**: Mock external dependencies to isolate the code being tested
3. **Test Coverage**: Aim for comprehensive test coverage of critical functionality
4. **Readability**: Use descriptive test names and follow the Arrange-Act-Assert pattern
5. **Speed**: Optimize tests for fast execution without extending timeouts
6. **Cleanup**: Properly reset state and restore stubs after each test

## Adding New Tests

When adding new tests:

1. Place the test file in the appropriate directory based on what it's testing
2. Use the appropriate testing utilities (Chai, Sinon, Testing Library)
3. Follow the established patterns in existing tests
4. Verify that path aliases are resolved correctly
5. Keep tests focused and specific to the functionality being tested

## Troubleshooting Common Issues

### Path Resolution Problems

If you encounter import errors related to path aliases:

1. Verify aliases are defined correctly in `setup-path-aliases.js`
2. Check that the module resolver is properly loaded in `.mocharc.json`
3. Try using relative paths as a fallback if needed

### JSDOM Simulation Issues

For DOM-related test failures:

1. Check if the DOM API is properly mocked in `jsdom-setup.js`
2. Add missing browser API mocks as needed
3. Verify that event handlers are working correctly

### Timeout Issues

If tests are timing out:

1. Check for unresolved promises or missing `await` statements
2. Look for infinite loops or blocked execution
3. Verify that mocks and stubs are configured correctly
4. Optimize slow operations rather than extending timeouts