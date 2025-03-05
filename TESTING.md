# Testing Guide

This document outlines the testing approach for the Volleyball League Management Platform.

## Testing Stack

- **Mocha**: Test runner
- **Chai**: Assertion library
- **Sinon**: Mocking, stubbing, and spying
- **Supertest**: HTTP assertions for API testing
- **React Testing Library**: Components testing
- **JSDOM**: DOM environment for frontend tests

## Test Structure

```
test/
├── db/              # Database operation tests
├── server/          # API endpoint tests
├── client/          # React component tests
│   └── components/  # UI component tests
└── utils.test.ts    # Utility function tests
```

## Running Tests

We provide a convenient script to run tests. Make it executable with `chmod +x run-tests.sh`.

```bash
# Run all tests
./run-tests.sh all

# Run only database tests
./run-tests.sh db

# Run only server API tests
./run-tests.sh server

# Run only client component tests
./run-tests.sh client

# Run only utility function tests
./run-tests.sh utils

# Run tests in watch mode
./run-tests.sh watch

# Show usage information
./run-tests.sh help
```

## Test Types

### Database Tests

These tests verify database operations with mocked database connections to avoid actual database dependencies. We use Sinon to stub the database methods.

### API Tests

API tests verify that our Express routes work correctly. We use Supertest to make HTTP assertions without starting a real server. The database is mocked to isolate tests.

### Component Tests

React component tests verify that our UI components render correctly and respond to user interactions. We use React Testing Library with a JSDOM environment.

### Utility Tests

Pure function tests verify that our utility functions work as expected.

## Mocking Strategy

We use different mocking approaches depending on the test type:

- **Database**: Direct mocking of the Drizzle ORM methods
- **APIs**: Mocking database dependencies, not the actual HTTP layer
- **Components**: Mocking API calls and external dependencies

## Best Practices

1. Write focused, isolated tests
2. Use descriptive test names (e.g., "should return 404 when user not found")
3. Set up and tear down test resources properly
4. Keep tests independent (no shared state)
5. Mock external dependencies
6. Test both happy paths and edge cases