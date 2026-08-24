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
});
