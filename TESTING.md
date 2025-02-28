# Testing Guide for Volleyball League Application

This document provides guidance for writing and running tests in the Volleyball League application.

## Testing Philosophy

We follow these key principles for our tests:

1. **Isolation**: Tests should run in isolation without external dependencies like databases.
2. **Fast Execution**: Tests should be quick to run to support rapid development.
3. **Reliability**: Tests should be deterministic and not flaky.
4. **Clarity**: Test failures should provide clear indications of what failed.

## Test Structure

The application has two main types of tests:

### Server Tests

Located in `server/__tests__/`, these tests focus on:
- API routes and controllers
- Data utilities
- Business logic

### Client Tests

Located in `client/src/__tests__/`, these tests focus on:
- React components
- Hooks
- Utility functions
- State management

## Running Tests

You can run tests using the provided scripts:

```
# Run all tests
node run-tests.js all

# Run only server tests
node run-tests.js server

# Run only client tests
node run-tests.js client
```

## Mocking

### Database Mocking

We use a custom mock implementation for Drizzle ORM in `server/__tests__/setup.ts`. This allows us to:
- Test database queries without a real database connection
- Configure mock responses for different test scenarios
- Verify that the correct queries are being made

Example of configuring mock results:

```typescript
import { configureMockDb, getMockData } from './setup';

// Configure mock data for a test
configureMockDb({ 
  selectResults: getMockData.players 
});
```

### Component Mocking

For client-side tests, we mock:
- External dependencies (React Query, Recharts, etc.)
- Network requests using Jest's mock for `fetch`
- Router functionality (wouter)

### JSX-Free Mocking Approach

We use a JSX-free approach for mocking React components in tests to ensure maximum compatibility with Jest. Instead of using JSX syntax in mock implementations, we use `React.createElement`:

```javascript
// ❌ Don't use JSX in mock implementations
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
}));

// ✅ Use React.createElement instead
jest.mock('recharts', () => {
  const React = require('react');
  
  return {
    ResponsiveContainer: function(props) {
      return React.createElement('div', { 'data-testid': 'responsive-container' }, props.children);
    },
    LineChart: function(props) {
      return React.createElement('div', { 'data-testid': 'line-chart' }, props.children);
    }
  };
});
```

For common components, we have reusable mock implementations in the `client/src/__mocks__/` directory:

- `rechartsMock.js`: Mocks for Recharts visualization components
- `chartMock.js`: Mocks for Chart.js components
- `fileMock.js`: Mock for file imports (images, etc.)
- `styleMock.js`: Mock for CSS/SCSS style imports

## Writing Effective Tests

### Server Tests

1. Use the mock DB utilities to avoid real database connections
2. Test API routes with supertest
3. Include both happy path and error cases

Example:

```typescript
describe('GET /api/players', () => {
  it('returns list of players', async () => {
    // Setup mock data
    configureMockDb({ 
      selectResults: getMockData.players 
    });

    // Execute request
    const response = await request(app).get('/api/players');
    
    // Verify response
    expect(response.status).toBe(200);
    expect(response.body).toBeTruthy();
  });
});
```

### Client Tests

1. Use React Testing Library to test components
2. Test user interactions using fireEvent and userEvent
3. Verify the correct elements appear in the DOM

Example:

```typescript
test('renders the dashboard with all sections', () => {
  render(<Dashboard />, { wrapper: Wrapper });
  
  // Check for main sections
  expect(screen.getByText('Volleyball Stats Dashboard')).toBeInTheDocument();
  expect(screen.getByText('Recent Matches')).toBeInTheDocument();
  expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
});
```

## TypeScript and Testing

We use TypeScript throughout our tests to ensure type safety. This includes:

- Properly typed mock data and functions
- Interface definitions for test data structures
- Type checking for component props and state

## Best Practices

1. Keep tests focused on a single behavior or feature
2. Use descriptive test and assertion names
3. Minimize test setup code by using shared fixtures and helpers
4. Clean up after tests to avoid affecting other tests
5. Group related tests using `describe` blocks
6. Use beforeEach/afterEach hooks for common setup and teardown
7. Prefer specific assertions (e.g., `toHaveTextContent`) over generic ones

## Troubleshooting Common Issues

- **"Invalid URL" errors**: The tests are trying to connect to a real database. Make sure your mock DB setup is configured correctly.
- **React component render issues**: Check that all required context providers are available in your test setup.
- **JSX errors in tests**: Ensure proper mocking of UI components that might cause issues with Jest's transform.