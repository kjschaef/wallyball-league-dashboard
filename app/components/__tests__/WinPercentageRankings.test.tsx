import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WinPercentageRankings } from '../WinPercentageRankings';


jest.mock('../../lib/playerFiltering', () => ({
  getPlayerThreshold: jest.fn(() => 50),
}));

describe('WinPercentageRankings', () => {
  const mockPlayerStats = [
    { id: 1, name: 'Alice', winPercentage: 60.5, record: { totalGames: 100 } },
    { id: 2, name: 'Bob', winPercentage: 55.2, record: { totalGames: 80 } },
    { id: 3, name: 'Charlie', winPercentage: 45.0, record: { totalGames: 60 } },
    { id: 4, name: 'Dave', winPercentage: 50.0, record: { totalGames: 40 } }, // Below threshold
  ];

  const mockMatches = [
    {
      id: 1,
      date: new Date().toISOString(),
      teamOnePlayers: ['Alice'],
      teamTwoPlayers: ['Charlie'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.Mock;

    // Default mock implementation
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes('/api/player-stats')) {
        return { ok: true, json: async () => mockPlayerStats };
      }
      if (url.includes('/api/matches?limit=10')) {
        return { ok: true, json: async () => mockMatches };
      }
      return { ok: false, status: 404 };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders loading state initially', async () => {
    // We don't await act here intentionally to see the loading state
    render(<WinPercentageRankings />);
    expect(screen.getByText('Loading rankings...')).toBeInTheDocument();

    // Wait for the async operations to complete so we don't get act warnings
    await waitFor(() => {
      expect(screen.queryByText('Loading rankings...')).not.toBeInTheDocument();
    });
  });

  it('renders player rankings based on fetch data and threshold', async () => {
    await act(async () => {
      render(<WinPercentageRankings />);
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();

    // Dave is below the threshold of 50 games
    expect(screen.queryByText('Dave')).not.toBeInTheDocument();

    expect(screen.getByText('60.5%')).toBeInTheDocument();
    expect(screen.getByText('55.2%')).toBeInTheDocument();
    expect(screen.getByText('45.0%')).toBeInTheDocument();

    expect(screen.getByText('100 games')).toBeInTheDocument();
    expect(screen.getByText('80 games')).toBeInTheDocument();
    expect(screen.getByText('60 games')).toBeInTheDocument();
  });

  it('fetches data with season parameter if provided', async () => {
    await act(async () => {
      render(<WinPercentageRankings season="spring-2024" />);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/player-stats?season=spring-2024');
    expect(global.fetch).toHaveBeenCalledWith('/api/matches?limit=10');
  });

  it('highlights players in recent matches with border style', async () => {
    await act(async () => {
      render(<WinPercentageRankings />);
    });

    // We can't easily assert the exact border color logic without knowing the specific color,
    // but we can check if the element has inline styles for border.
    const aliceElement = screen.getByText('Alice').closest('.border');
    expect(aliceElement).toHaveStyle('border-width: 2px');

    const charlieElement = screen.getByText('Charlie').closest('.border');
    expect(charlieElement).toHaveStyle('border-width: 2px');

    const bobElement = screen.getByText('Bob').closest('.border');
    // Bob wasn't in recent match, shouldn't have 2px border
    expect(bobElement).not.toHaveStyle('border-width: 2px');
  });

  it('falls back to mock data if stats fetch fails', async () => {
    // Suppress expected console.error during this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes('/api/player-stats')) {
        return { ok: false, status: 500 };
      }
      return { ok: true, json: async () => [] };
    });

    await act(async () => {
      render(<WinPercentageRankings />);
    });

    // Check for some mock data values
    expect(screen.getByText('Troy')).toBeInTheDocument();
    expect(screen.getByText('Nate')).toBeInTheDocument();
    expect(screen.getByText('57.1%')).toBeInTheDocument();

    expect(consoleSpy).toHaveBeenCalled();
  });
});
