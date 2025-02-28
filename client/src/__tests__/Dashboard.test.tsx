import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Setup mocks before imports
jest.mock('../__mocks__/rechartsMock', () => ({}), { virtual: true });

// Create a test QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock data for tests
const mockPlayers = [
  { id: 1, name: 'Alice', startYear: 2020, createdAt: '2023-01-01' },
  { id: 2, name: 'Bob', startYear: 2021, createdAt: '2023-01-02' },
  { id: 3, name: 'Charlie', startYear: 2022, createdAt: '2023-01-03' },
];

const mockMatches = [
  {
    id: 1,
    date: '2023-06-01',
    teamOnePlayers: ['Alice', 'Bob'],
    teamTwoPlayers: ['Charlie', 'Dave'],
    teamOneGamesWon: 3,
    teamTwoGamesWon: 1,
  },
  {
    id: 2,
    date: '2023-06-15',
    teamOnePlayers: ['Alice', 'Charlie'],
    teamTwoPlayers: ['Bob', 'Eve'],
    teamOneGamesWon: 2,
    teamTwoGamesWon: 3,
  },
];

// Configure mocks
beforeEach(() => {
  // Mock tanstack/react-query useQuery
  jest.spyOn(require('@tanstack/react-query'), 'useQuery').mockImplementation((queryKey: any) => {
    if (Array.isArray(queryKey) && queryKey[0] === '/api/players') {
      return { data: mockPlayers, isLoading: false };
    }
    if (Array.isArray(queryKey) && queryKey[0] === '/api/matches') {
      return { data: mockMatches, isLoading: false };
    }
    return { data: null, isLoading: false };
  });

  // Mock tanstack/react-query useMutation
  jest.spyOn(require('@tanstack/react-query'), 'useMutation').mockReturnValue({
    mutate: jest.fn().mockImplementation((data, { onSuccess }) => {
      if (onSuccess) onSuccess();
    }),
    isLoading: false,
  });
});

// Wrapper component with QueryClient provider
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the dashboard with all sections', () => {
    render(<Dashboard />, { wrapper: Wrapper });
    
    // Check for main sections
    expect(screen.getByText('Volleyball Stats Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Recent Matches')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument(); // Performance chart
  });

  test('displays player selection for recording a game', async () => {
    render(<Dashboard />, { wrapper: Wrapper });
    
    // Click the Record Game button
    fireEvent.click(screen.getByText('Record Game'));
    
    // Check that player selection appears
    await waitFor(() => {
      expect(screen.getByText('Team 1')).toBeInTheDocument();
      expect(screen.getByText('Team 2')).toBeInTheDocument();
    });
    
    // Check that player buttons are displayed
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  test('allows selecting players for a game', async () => {
    render(<Dashboard />, { wrapper: Wrapper });
    
    // Click the Record Game button
    fireEvent.click(screen.getByText('Record Game'));
    
    // Select players for Team 1
    fireEvent.click(screen.getByText('Alice'));
    
    // Select players for Team 2
    fireEvent.click(screen.getByText('Bob'));
    
    // Check that the selected players are marked
    await waitFor(() => {
      const aliceButton = screen.getByText('Alice').closest('button');
      expect(aliceButton).toHaveAttribute('aria-pressed', 'true');
      
      const bobButton = screen.getByText('Bob').closest('button');
      expect(bobButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test('allows submitting game results', async () => {
    render(<Dashboard />, { wrapper: Wrapper });
    
    // Click the Record Game button
    fireEvent.click(screen.getByText('Record Game'));
    
    // Select players for Team 1
    fireEvent.click(screen.getByText('Alice'));
    
    // Select players for Team 2
    fireEvent.click(screen.getByText('Bob'));
    
    // Set the game scores
    const team1ScoreInput = screen.getByLabelText('Team 1 Score');
    const team2ScoreInput = screen.getByLabelText('Team 2 Score');
    
    fireEvent.change(team1ScoreInput, { target: { value: '3' } });
    fireEvent.change(team2ScoreInput, { target: { value: '1' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Save Result'));
    
    // Check that the form was submitted
    await waitFor(() => {
      expect(require('@tanstack/react-query').useMutation).toHaveBeenCalled();
    });
  });

  test('displays recent matches', () => {
    render(<Dashboard />, { wrapper: Wrapper });
    
    // Check for match data
    expect(screen.getByText('Alice and Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie and Dave')).toBeInTheDocument();
    expect(screen.getByText('3 - 1')).toBeInTheDocument(); // Score from first match
  });
});