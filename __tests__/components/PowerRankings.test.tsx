import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PowerRankings } from '@/app/components/PowerRankings';

describe('PowerRankings Component', () => {
  const mockStats = [
    { id: 1, name: 'Alice', elo: 1680, isProvisional: false, careerGames: 45, winPercentage: 65 },
    { id: 2, name: 'Bob', elo: 1610, isProvisional: false, careerGames: 35, winPercentage: 60 },
    { id: 3, name: 'Charlie', elo: 1540, isProvisional: false, careerGames: 25, winPercentage: 55 },
    { id: 4, name: 'Dave', elo: 1480, isProvisional: false, careerGames: 18, winPercentage: 48 },
    { id: 5, name: 'Eve', elo: 1520, isProvisional: true, careerGames: 5, winPercentage: 50 },
  ];

  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/player-stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStats),
        });
      }
      if (url.includes('/api/matches')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 1,
              date: new Date().toISOString(),
              teamOnePlayers: ['Alice'],
              teamTwoPlayers: ['Bob'],
              teamOneGamesWon: 3,
              teamTwoGamesWon: 0,
            }
          ]),
        });
      }
      return Promise.resolve({ ok: false });
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders League Power Rankings with podium medals and ladder', async () => {
    await act(async () => {
      render(<PowerRankings />);
    });

    expect(screen.getByText(/League Power Rankings/i)).toBeInTheDocument();
    expect(screen.getAllByText('Alice')[0]).toBeInTheDocument();
    expect(screen.getByText('1680')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Dave')).toBeInTheDocument();
  });

  it('displays provisional badge for provisional players', async () => {
    await act(async () => {
      render(<PowerRankings />);
    });

    expect(screen.getByText('Eve')).toBeInTheDocument();
    expect(screen.getByText('PROV')).toBeInTheDocument();
  });
});
