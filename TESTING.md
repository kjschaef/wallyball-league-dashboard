# Testing Infrastructure for Volleyball League Management Platform

This document provides an overview of the testing infrastructure and guidelines for the volleyball league management platform.

## Project Status

### Completed
- ✅ Basic JavaScript test infrastructure with passing tests
- ✅ TypeScript test infrastructure with ES module support
- ✅ JSDOM environment setup for component testing
- ✅ React component test examples (StatCard, PlayerSelector)
- ✅ Mock database configuration for database tests
- ✅ API test infrastructure with proper request/response validation

### In Progress
- 🔄 Path alias resolution in TypeScript tests
- 🔄 Mock implementation for UI components
- 🔄 Global mock system for dependencies

### Next Steps
- Integration tests for key workflows
- Performance testing for critical queries
- End-to-end testing with database integration

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

## Test Files and Responsibilities

Each test file has specific responsibilities:

### Component Tests
- `PlayerSelector.test.tsx`: Tests player selection UI, state management, and interactions
- `StatCard.test.tsx`: Tests statistics display component with different prop combinations

### Database Tests
- `player.test.ts`: Tests player CRUD operations and validation rules
- `mockDb.ts`: Provides an in-memory database implementation for isolated testing

### API Tests
- `api.test.ts`: Tests API endpoints for proper request handling and response formatting

## Configuration Files

- **.mocharc.json**: Mocha configuration with timeout settings, extensions, and module loading options
- **run-ts-tests.sh**: Script for running TypeScript tests with proper environment variables
- **run-tests.sh**: Script for running all tests or specific test categories

## Mock Implementation

The testing infrastructure includes a robust mocking system:

### Component Mocks
```typescript
// Mock Button component
const MockButton = ({ children, variant, className, onClick, disabled }) => (
  <button 
    onClick={onClick} 
    className={className} 
    data-state={variant === 'default' ? 'on' : 'off'}
    disabled={disabled}
  >
    {children}
  </button>
);

// Mock ScrollArea component
const MockScrollArea = ({ children }) => (
  <div data-testid="scroll-area">{children}</div>
);
```

### Utility Mocks
```typescript
// Mock the cn utility from utils.ts
const cn = (...inputs) => inputs.filter(Boolean).join(' ');
```

### Database Mocks
```typescript
// Mock database class from mockDb.ts
export class MockDatabase {
  private players = [];
  
  async createPlayer(player) {
    // Implementation
  }
  
  async getPlayerById(id) {
    // Implementation
  }
  
  // Other methods...
}
```

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

# Run basic tests only (fastest)
./run-tests.sh basic
```

## JSDOM Environment

For React component testing, we use JSDOM to simulate a browser environment with:

- DOM API (document, window, etc.)
- Event handling
- Browser-like behavior
- CSS support mocks
- Local storage mocks
- Media query simulation

Key JSDOM setup code:
```javascript
// Set up JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
  runScripts: 'dangerously'
});

// Set up global variables
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;

// Mock implementations
global.window.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 0);
};
```

## Testing Strategies

### Database Testing

Database tests verify the correctness of:

- Schema definitions
- Query operations
- Data validation
- Error handling

```typescript
// Example database test
it('creates a player correctly', async () => {
  const mockPlayer = { name: 'Test Player', startYear: 2023 };
  const createdPlayer = await mockDb.createPlayer(mockPlayer);
  
  expect(createdPlayer.id).to.exist;
  expect(createdPlayer.name).to.equal('Test Player');
});
```

### API Testing

API tests verify:

- Route handling
- Request validation
- Response formatting
- Error scenarios

```typescript
// Example API test
it('returns 200 for valid player creation', async () => {
  const response = await request(app)
    .post('/api/players')
    .send({ name: 'New Player', startYear: 2023 });
    
  expect(response.status).to.equal(200);
  expect(response.body.id).to.exist;
});
```

### Component Testing

React component tests verify:

- Rendering correctness
- User interactions
- Prop handling
- State management

```typescript
// Example component test
it('renders with title and value', () => {
  render(
    <StatCard 
      title="Win Rate" 
      value="75%" 
    />
  );
  
  expect(screen.getByText('Win Rate')).to.exist;
  expect(screen.getByText('75%')).to.exist;
});
```

## Best Practices

1. **Independence**: Tests should not rely on state from other tests
2. **Mocking**: Mock external dependencies to isolate code under test
3. **Descriptive Names**: Use clear test names that describe expected behavior
4. **Arrange-Act-Assert**: Structure tests with setup, action, and verification phases
5. **Fast Execution**: Tests should run quickly without timeout extensions
6. **Proper Cleanup**: Reset state and restore stubs after each test

## Troubleshooting

### Path Resolution Issues

If you encounter path alias resolution problems:

1. Use relative paths as a temporary solution
2. Check module-resolver.js configuration
3. Verify that paths match the project structure

### Common Errors

1. **"Cannot find module"**: Check import paths and make sure dependencies are installed
2. **"TypeError: undefined is not a function"**: Check that all mocks are properly implemented
3. **"Cannot read property 'X' of undefined"**: Verify that objects are properly initialized before access

### Performance Issues

If tests are running slowly:

1. Minimize network requests in tests
2. Use in-memory database implementations
3. Mock heavy computations
4. Group related tests to reduce setup/teardown overhead