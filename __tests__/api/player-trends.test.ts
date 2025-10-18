import { NextRequest } from 'next/server';
import { GET } from '@/app/api/player-trends/route';

const mockSql = jest.fn();

const createMockSql = () =>
  Object.assign(
    jest.fn().mockImplementation((strings: TemplateStringsArray, ...values: any[]) => {
      const query = strings.join('').toLowerCase();
      if (query.includes('select * from players')) {
        return mockSql('players');
      }
      if (query.includes('select * from matches')) {
        return mockSql('matches');
      }
      if (query.includes('from inactivity_exemptions')) {
        return mockSql('exemptions', values[0]);
      }
      return mockSql('unknown');
    }),
    { transaction: jest.fn() }
  );

jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => createMockSql()),
}));

jest.mock('@/lib/inactivity-penalty', () => ({
  calculateSeasonalPenaltySeries: jest.fn().mockReturnValue({}),
  isWithinExemption: jest.fn().mockReturnValue(false),
}));

const { isWithinExemption } = require('@/lib/inactivity-penalty') as { isWithinExemption: jest.Mock };
const { neon } = require('@neondatabase/serverless') as { neon: jest.Mock };
const originalDbUrl = process.env.DATABASE_URL;

beforeEach(() => {
  process.env.DATABASE_URL = 'mock-db-url';
  jest.clearAllMocks();
});

afterEach(() => {
  process.env.DATABASE_URL = originalDbUrl;
  jest.useRealTimers();
});

describe('/api/player-trends', () => {
  it('builds daily trend data while honoring exemption windows', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-02-01T00:00:00.000Z'));

    const mockPlayers = [
      { id: 1, name: 'Alice', start_year: 2020, created_at: '2020-01-01T00:00:00.000Z' },
    ];
    const mockMatches = [
      {
        id: 1,
        team_one_player_one_id: 1,
        team_one_player_two_id: null,
        team_one_player_three_id: null,
        team_two_player_one_id: 2,
        team_two_player_two_id: null,
        team_two_player_three_id: null,
        team_one_games_won: 3,
        team_two_games_won: 0,
        date: '2024-12-01T00:00:00.000Z',
      },
    ];

    mockSql.mockImplementation((queryType) => {
      if (queryType === 'players') {
        return Promise.resolve(mockPlayers);
      }
      if (queryType === 'matches') {
        return Promise.resolve(mockMatches);
      }
      if (queryType === 'exemptions') {
        return Promise.resolve([
          { start_date: '2024-12-15T00:00:00.000Z', end_date: '2024-12-28T00:00:00.000Z' },
        ]);
      }
      return Promise.resolve([]);
    });

    isWithinExemption.mockImplementation((date: Date) => {
      const iso = date.toISOString().split('T')[0];
      return iso === '2024-12-22';
    });

    const request = new NextRequest('http://localhost:3000/api/player-trends');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].name).toBe('Alice');

    const dailyStats = data[0].dailyStats;
    expect(dailyStats['2024-12-22'].inactivityPenalty).toBe(0);
    expect(dailyStats['2024-12-29'].inactivityPenalty).toBeGreaterThan(0);
    expect(isWithinExemption).toHaveBeenCalled();
  });

  it('returns 404 when a requested season cannot be resolved', async () => {
    mockSql.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/player-trends?season=9999');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Season not found' });
    expect(mockSql).not.toHaveBeenCalled();
    expect(neon).toHaveBeenCalledTimes(1);
  });
});
