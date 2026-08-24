import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuarterlyStandingsTable } from '@/app/components/QuarterlyStandingsTable';

describe('QuarterlyStandingsTable Component', () => {
  const mockStandings = [
    { id: 1, name: 'Alice', record: { wins: 14, losses: 4, totalGames: 18 }, winPercentage: 77.8 },
    { id: 2, name: 'Bob', record: { wins: 10, losses: 8, totalGames: 18 }, winPercentage: 55.6 },
    { id: 3, name: 'Charlie', record: { wins: 6, losses: 12, totalGames: 18 }, winPercentage: 33.3 },
  ];

  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStandings),
      })
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders Season Standings table with ranks, records, and win rates', async () => {
    await act(async () => {
      render(<QuarterlyStandingsTable season="current" />);
    });

    expect(screen.getByText(/Season Standings/i)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('77.8%')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('55.6%')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('33.3%')).toBeInTheDocument();
    expect(screen.getByText('3 Active Players')).toBeInTheDocument();
  });

  it('respects 50-game minimum when at least one player has 50+ games and showAllPlayers is false', async () => {
    const mixedStandings = [
      { id: 1, name: 'Qualified Player', record: { wins: 35, losses: 15, totalGames: 50 }, winPercentage: 70.0 },
      { id: 2, name: 'Under Minimum Player', record: { wins: 10, losses: 5, totalGames: 15 }, winPercentage: 66.7 },
    ];

    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mixedStandings),
      })
    );

    await act(async () => {
      render(<QuarterlyStandingsTable season="current" showAllPlayers={false} />);
    });

    expect(screen.getByText('Qualified Player')).toBeInTheDocument();
    expect(screen.queryByText('Under Minimum Player')).not.toBeInTheDocument();
    expect(screen.getByText('1 Active Players')).toBeInTheDocument();
  });

  it('shows all players who played when showAllPlayers is true even if 50-game threshold is met by others', async () => {
    const mixedStandings = [
      { id: 1, name: 'Qualified Player', record: { wins: 35, losses: 15, totalGames: 50 }, winPercentage: 70.0 },
      { id: 2, name: 'Under Minimum Player', record: { wins: 10, losses: 5, totalGames: 15 }, winPercentage: 66.7 },
    ];

    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mixedStandings),
      })
    );

    await act(async () => {
      render(<QuarterlyStandingsTable season="current" showAllPlayers={true} />);
    });

    expect(screen.getByText('Qualified Player')).toBeInTheDocument();
    expect(screen.getByText('Under Minimum Player')).toBeInTheDocument();
    expect(screen.getByText('2 Active Players')).toBeInTheDocument();
  });
});
