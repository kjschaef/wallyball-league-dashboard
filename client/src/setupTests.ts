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
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
    ul: 'ul',
    li: 'li',
    p: 'p',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => require('../__mocks__/chartMock.js'));

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
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
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

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