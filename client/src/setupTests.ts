// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock global fetch to avoid network requests
global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve([]),
    ok: true,
    status: 200,
    text: () => Promise.resolve(""),
  } as Response)
);

// Speed up animations in tests
jest.mock('framer-motion', () => {
  const React = require('react');
  
  return {
    motion: {
      div: (props: React.HTMLAttributes<HTMLDivElement>) => React.createElement('div', props),
      span: (props: React.HTMLAttributes<HTMLSpanElement>) => React.createElement('span', props),
      button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => React.createElement('button', props),
      ul: (props: React.HTMLAttributes<HTMLUListElement>) => React.createElement('ul', props),
      li: (props: React.HTMLAttributes<HTMLLIElement>) => React.createElement('li', props),
      p: (props: React.HTMLAttributes<HTMLParagraphElement>) => React.createElement('p', props),
    },
    AnimatePresence: (props: { children: React.ReactNode }) => React.createElement(React.Fragment, null, props.children),
  };
});

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => require('./__mocks__/rechartsMock'));

// Mock react-query
jest.mock('@tanstack/react-query', () => {
  const React = require('react');
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
    QueryClientProvider: (props: { children: React.ReactNode; client: any }) => {
      return React.createElement(React.Fragment, null, props.children);
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