import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PowerRankings } from '@/app/components/PowerRankings';

describe('PowerRankings Component', () => {
  const recentDate = new Date().toISOString();
  const oldDate = new Date(Date.now() - 250 * 24 * 60 * 60 * 1000).toISOString(); // ~8 months ago

  const mockStats = [
    { id: 1, name: 'Alice', elo: 1680, isProvisional: false, careerGames: 45, winPercentage: 65, lastGameDate: recentDate },
    { id: 2, name: 'Bob', elo: 1610, isProvisional: false, careerGames: 35, winPercentage: 60, lastGameDate: recentDate },
    { id: 3, name: 'Charlie', elo: 1540, isProvisional: false, careerGames: 25, winPercentage: 55, lastGameDate: recentDate },
    { id: 4, name: 'Dave', elo: 1480, isProvisional: false, careerGames: 18, winPercentage: 48, lastGameDate: recentDate },
    { id: 5, name: 'Eve', elo: 1520, isProvisional: true, careerGames: 5, winPercentage: 50, lastGameDate: recentDate },
    { id: 6, name: 'OldPlayer', elo: 1750, isProvisional: false, careerGames: 60, winPercentage: 70, lastGameDate: oldDate },
    { id: 7, name: 'NeverPlayed', elo: 1500, isProvisional: true, careerGames: 0, winPercentage: 0, lastGameDate: null },
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

  it('renders League Power Rankings with podium medals and ladder for active players', async () => {
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

  it('excludes inactive players who have not played in the last 6 months or have never played', async () => {
    await act(async () => {
      render(<PowerRankings />);
    });

    expect(screen.queryByText('OldPlayer')).not.toBeInTheDocument();
    expect(screen.queryByText('NeverPlayed')).not.toBeInTheDocument();
  });

  it('displays provisional badge with calibration count for provisional players', async () => {
    await act(async () => {
      render(<PowerRankings />);
    });

    expect(screen.getByText('Eve')).toBeInTheDocument();
    expect(screen.getByText('PROV (5/10)')).toBeInTheDocument();
  });

  it('renders "How it works" button and opens explainer modal on click', async () => {
    await act(async () => {
      render(<PowerRankings />);
    });

    const howItWorksBtn = screen.getByRole('button', { name: /how it works/i });
    expect(howItWorksBtn).toBeInTheDocument();

    await act(async () => {
      howItWorksBtn.click();
    });

    expect(screen.getByText(/How League Power Rankings Work/i)).toBeInTheDocument();
    expect(screen.getByText(/Scored Games vs\. Unscored Games/i)).toBeInTheDocument();
    expect(screen.getByText(/Up to 2\.0x Multiplier/i)).toBeInTheDocument();
  });
});
