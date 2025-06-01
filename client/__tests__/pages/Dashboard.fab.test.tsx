import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Dashboard from '../../src/pages/Dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock child components that make API calls or have complex internal state, if necessary
jest.mock('../../src/components/PerformanceTrend', () => ({
  PerformanceTrend: () => <div data-testid="performance-trend">Performance Trend</div>,
}));
jest.mock('../../src/components/DailyWins', () => ({
  DailyWins: () => <div data-testid="daily-wins">Daily Wins</div>,
}));

// Mock players data
const mockPlayers = [
  { id: 1, name: 'Player 1', wins: 10, losses: 5, winPercentage: 66.67, currentWinStreak: 3, longestWinStreak: 5, elo: 1200 },
  { id: 2, name: 'Player 2', wins: 8, losses: 7, winPercentage: 53.33, currentWinStreak: 0, longestWinStreak: 2, elo: 1150 },
];

// Mock matches data
const mockMatches = [
    { id: 1, date: new Date().toISOString(), teamOnePlayerOneId: 1, teamOnePlayerTwoId: null, teamOnePlayerThreeId: null, teamTwoPlayerOneId: 2, teamTwoPlayerTwoId: null, teamTwoPlayerThreeId: null, teamOneGamesWon: 2, teamTwoGamesWon: 1, notes: 'Test Match 1'},
];


const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for tests
      staleTime: Infinity, // Prevent immediate refetch
    },
  },
});

const renderDashboard = (queryClient: QueryClient) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
};

describe('Dashboard FAB and Dialog', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    // Pre-populate react-query cache if needed for components, though Dashboard itself fetches
    queryClient.setQueryData(['/api/players'], mockPlayers);
    queryClient.setQueryData(['/api/matches'], mockMatches);
  });

  afterEach(() => {
    queryClient.clear();
  });

  test('FAB exists, opens dropdown, and Record Game dialog appears on click', async () => {
    renderDashboard(queryClient);

    // 1. Verify FAB (DropdownMenuTrigger) exists
    // Find the FAB by its data-testid
    const fabButton = screen.getByTestId('fab-trigger');
    expect(fabButton).toBeInTheDocument();

    // 2. Click FAB to open dropdown
    await userEvent.click(fabButton);

    // 3. Verify "Record Match" option is in the dropdown and click it
    // First, wait for the menu itself to appear. Radix DropdownMenuContent has role 'menu'.
    const menu = await screen.findByRole('menu');
    expect(menu).toBeInTheDocument();

    // For debugging: print the content of the menu
    // screen.debug(menu, 300000);

    // Now, find the menuitem within that menu.
    const recordMatchOption = await screen.findByText(/record match/i, { selector: '[role="menuitem"]' });

    expect(recordMatchOption).toBeInTheDocument();
    expect(recordMatchOption).toHaveAttribute('role', 'menuitem');
    await userEvent.click(recordMatchOption);

    // 4. Assert that the "Record Game" dialog becomes visible
    // Check for the dialog's title
    await waitFor(() => {
      // DialogTitle is typically a heading role
      expect(screen.getByRole('heading', { name: /record game/i, level: 2 })).toBeVisible();
    });

    // Optionally, check for some other unique content if the title is too generic
    expect(screen.getByText(/Enter the game details including teams, scores, and date./i)).toBeVisible();
  });
});
