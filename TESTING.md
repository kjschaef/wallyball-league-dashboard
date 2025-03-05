# Testing Infrastructure for Volleyball League Management Platform

This document provides an overview of the testing infrastructure and guidelines for the volleyball league management platform.

## Overview

The testing infrastructure is designed to be:

1. **Fast**: Tests run quickly to provide immediate feedback during development
2. **Reliable**: Tests are deterministic and do not depend on external services when possible
3. **Maintainable**: Tests are well-structured and follow consistent patterns

## Test Framework

The project uses the following testing stack:

- **Mocha**: Test runner
- **Chai**: Assertion library
- **Sinon**: Mocking and stubbing library
- **Testing Library**: For React component testing
- **SuperTest**: For API endpoint testing

## Test Directory Structure

```
test/
├── client/                 # Frontend component tests
│   └── components/         # React component tests
├── db/                     # Database tests
│   └── mockDb.ts           # Mock database implementation for tests
├── server/                 # API and server tests
├── setup.ts                # Global test setup and configuration
├── simple.test.js          # Basic test validation
└── utils.test.ts           # Utility function tests
```

## Running Tests

Tests can be run using the `run-tests.sh` script:

```bash
# Run all tests
./run-tests.sh all

# Run specific test categories
./run-tests.sh basic      # Run basic tests (JS only)
./run-tests.sh client     # Run frontend component tests
./run-tests.sh server     # Run API endpoint tests
./run-tests.sh db         # Run database tests
./run-tests.sh utils      # Run utility function tests

# Run tests in watch mode
./run-tests.sh watch
```

## Testing Strategies

### Database Testing

Database tests use a mock database implementation (`mockDb.ts`) that mimics the behavior of the actual database without requiring a real database connection. This approach allows for:

- Fast test execution
- No need to manage test database state
- Isolation from external dependencies

### API Testing

API tests use SuperTest to test the Express endpoints. The tests:

- Create an isolated Express app instance for each test
- Mock database responses
- Verify API contracts and behavior independently of the actual database

### Component Testing

React component tests use Testing Library to:

- Verify components render correctly
- Test user interactions
- Ensure accessibility best practices
- Validate props and state changes

## Best Practices

1. **Independence**: Each test should be independent and not rely on the state from other tests
2. **Mocking**: Mock external dependencies to isolate the code being tested
3. **Test Coverage**: Aim for comprehensive test coverage of critical functionality
4. **Readability**: Use descriptive test names and follow the Arrange-Act-Assert pattern
5. **Speed**: Optimize tests for fast execution to enable rapid feedback during development

## Adding New Tests

When adding new tests:

1. Follow the existing directory structure
2. Use the appropriate testing utilities for the type of test
3. Run tests locally before committing to ensure they pass
4. Consider adding both unit tests and integration tests for critical features

## Troubleshooting

If tests are failing, check the following:

- Ensure the test environment is properly set up
- Verify that mocks are configured correctly
- Check for timing issues in asynchronous tests
- Ensure that cleanup happens after each test