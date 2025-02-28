// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import React from 'react';

// Mock global fetch to avoid network requests
global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve([]),
    ok: true,
    status: 200,
    text: () => Promise.resolve(""),
  } as Response)
);

// Ensure React is available in the global scope for JSX transformation
global.React = React;

// Speed up animations in tests
jest.mock('framer-motion', () => {
  return {
    motion: {
      div: (props: any) => React.createElement('div', props),
      span: (props: any) => React.createElement('span', props),
      button: (props: any) => React.createElement('button', props),
      ul: (props: any) => React.createElement('ul', props),
      li: (props: any) => React.createElement('li', props),
      p: (props: any) => React.createElement('p', props),
    },
    AnimatePresence: (props: { children: React.ReactNode }) => React.createElement(React.Fragment, null, props.children),
  };
});

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => require('./__mocks__/rechartsMock'));

// Mock wouter for navigation
jest.mock('wouter', () => {
  return {
    Link: (props: any) => React.createElement('a', { href: props.to, onClick: (e: any) => e.preventDefault(), ...props }, props.children),
    useLocation: jest.fn().mockReturnValue(['/dashboard', jest.fn()]),
    useRoute: jest.fn().mockReturnValue([true, {}]),
  };
});

// Mock react-query
jest.mock('@tanstack/react-query', () => {
  const actualReactQuery = jest.requireActual('@tanstack/react-query');
  
  return {
    ...actualReactQuery,
    useQuery: jest.fn().mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    }),
    useMutation: jest.fn().mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: false,
    }),
    QueryClient: jest.fn().mockImplementation(() => ({
      prefetchQuery: jest.fn().mockResolvedValue(undefined),
      getQueryData: jest.fn(),
      setQueryData: jest.fn(),
      invalidateQueries: jest.fn(),
    })),
    QueryClientProvider: ({ children, client }: { children: React.ReactNode; client: any }) => {
      return React.createElement(React.Fragment, null, children);
    },
  };
});

// Mock window methods that might not be available in JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Speed up tests by mocking timers
jest.useFakeTimers();