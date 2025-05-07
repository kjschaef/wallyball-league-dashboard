import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PerformanceTrend } from '../../../client/src/components/PerformanceTrend';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as utils from '../../../client/src/lib/utils';

jest.mock('../../../client/src/lib/utils', () => ({
  ...jest.requireActual('../../../client/src/lib/utils'),
  calculateInactivityPenalty: jest.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('PerformanceTrend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    const mockQueryData = [
      {
        id: 1,
        name: 'Player 1',
        matches: [
          { date: '2025-04-01T00:00:00Z', isTeamOne: true, teamOneGamesWon: 3, teamTwoGamesWon: 1 },
          { date: '2025-04-15T00:00:00Z', isTeamOne: false, teamOneGamesWon: 1, teamTwoGamesWon: 3 },
          { date: '2025-05-01T00:00:00Z', isTeamOne: true, teamOneGamesWon: 2, teamTwoGamesWon: 2 },
        ],
      },
      {
        id: 2,
        name: 'Player 2',
        matches: [
          { date: '2025-04-01T00:00:00Z', isTeamOne: false, teamOneGamesWon: 3, teamTwoGamesWon: 1 },
          { date: '2025-04-15T00:00:00Z', isTeamOne: true, teamOneGamesWon: 1, teamTwoGamesWon: 3 },
        ],
      },
    ];
    
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockQueryData),
      })
    );
    
    (utils.calculateInactivityPenalty as jest.Mock).mockReturnValue({
      lastMatch: new Date(),
      weeksInactive: 0,
      penaltyPercentage: 0,
      decayFactor: 1
    });
  });

  test('renders loading state when data is not available', () => {
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
      })
    );
    
    render(<PerformanceTrend />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Loading player data...')).toBeInTheDocument();
  });

  test.skip('renders player data after loading', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([
        {
          id: 1,
          name: 'Player 1',
          matches: [
            { date: '2025-05-01T00:00:00Z', isTeamOne: true, teamOneGamesWon: 3, teamTwoGamesWon: 1 }
          ]
        }
      ])
    });
    
    render(<PerformanceTrend />, { wrapper: createWrapper() });
    
  });
});
