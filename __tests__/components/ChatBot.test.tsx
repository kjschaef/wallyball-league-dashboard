import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatBot } from '@/app/components/ChatBot';

jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: React.ReactNode }) {
    return <div data-testid="markdown">{children}</div>;
  };
});

const mockUseAdmin = jest.fn();
jest.mock('@/app/components/AdminProvider', () => ({
  useAdmin: () => mockUseAdmin(),
}));

describe('ChatBot Component', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAdmin.mockReturnValue({
      isAdmin: false,
      login: jest.fn(),
      logout: jest.fn(),
      requireAdmin: jest.fn(),
    });
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === '/api/chatbot') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            status: 'ready',
            playerCount: 10,
            capabilities: [],
            sampleQueries: [],
          }),
        });
      }
      if (url === '/api/players') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [],
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      });
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders the chatbot trigger button and opens dialog', async () => {
    render(<ChatBot />);
    const trigger = screen.getByRole('button', { name: /Chat Assistant/i });
    expect(trigger).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(await screen.findByText('Volleyball Team Assistant')).toBeInTheDocument();
  });

  it('displays Admin Login button in header when user is not admin', async () => {
    mockUseAdmin.mockReturnValue({
      isAdmin: false,
      login: jest.fn(),
      logout: jest.fn(),
      requireAdmin: jest.fn(),
    });

    render(<ChatBot isOpen={true} />);
    expect(screen.getByRole('button', { name: /Admin Login/i })).toBeInTheDocument();
  });

  it('does not display Admin Login button in header when user is admin', async () => {
    mockUseAdmin.mockReturnValue({
      isAdmin: true,
      login: jest.fn(),
      logout: jest.fn(),
      requireAdmin: jest.fn(),
    });

    render(<ChatBot isOpen={true} />);
    expect(screen.queryByRole('button', { name: /Admin Login/i })).not.toBeInTheDocument();
  });

  it('handles 401 Unauthorized response without displaying Invalid Date', async () => {
    const mockLogin = jest.fn();
    mockUseAdmin.mockReturnValue({
      isAdmin: false,
      login: mockLogin,
      logout: jest.fn(),
      requireAdmin: jest.fn(),
    });

    global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
      if (url === '/api/chatbot' && options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({
            error: 'Unauthorized',
            response: 'You must be signed in as an admin to use the chatbot.',
            timestamp: new Date().toISOString(),
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ready', playerCount: 10 }),
      });
    });

    render(<ChatBot isOpen={true} />);

    const input = screen.getByPlaceholderText(/Ask about player performance/i);
    fireEvent.change(input, { target: { value: 'Who is the top player?' } });

    const sendButton = screen.getByRole('button', { name: /Send message/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(
        screen.getByText('You must be signed in as an admin to use the chatbot.')
      ).toBeInTheDocument();
    });

    // Check that 'Invalid Date' is never rendered
    expect(screen.queryByText(/Invalid Date/i)).not.toBeInTheDocument();

    // Check that 'Log In as Admin' button appears
    const loginButton = screen.getByRole('button', { name: /Log In as Admin/i });
    expect(loginButton).toBeInTheDocument();
    fireEvent.click(loginButton);
    expect(mockLogin).toHaveBeenCalled();
  });

  it('safely handles missing or invalid timestamps without rendering Invalid Date', async () => {
    global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
      if (url === '/api/chatbot' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            response: 'Here are the stats.',
            timestamp: undefined, // Simulating undefined timestamp
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ready', playerCount: 10 }),
      });
    });

    render(<ChatBot isOpen={true} />);

    const input = screen.getByPlaceholderText(/Ask about player performance/i);
    fireEvent.change(input, { target: { value: 'How is Alice doing?' } });

    const sendButton = screen.getByRole('button', { name: /Send message/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Here are the stats.')).toBeInTheDocument();
    });

    expect(screen.queryByText(/Invalid Date/i)).not.toBeInTheDocument();
  });
});
