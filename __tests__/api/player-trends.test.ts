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
      return mockSql('unknown');
    }),
    { transaction: jest.fn() }
  );

jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => createMockSql()),
}));


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
  it('returns 500 when DATABASE_URL is not configured', async () => {
    const originalUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    const request = new NextRequest('http://localhost:3000/api/player-trends');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to fetch player trends' });

    process.env.DATABASE_URL = originalUrl;
  });

  it('returns 400 when an invalid season string is provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/player-trends?season=invalid');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid season parameter. Use "current", "lifetime", or a season ID.' });
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

  it('fetches all matches when no season is specified and calculates trends', async () => {
    mockSql.mockImplementation((queryName) => {
      if (queryName === 'players') {
        return Promise.resolve([
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ]);
      }
      if (queryName === 'matches') {
        return Promise.resolve([
          {
            id: 1,
            date: '2023-01-01T12:00:00Z',
            team_one_player_one_id: 1,
            team_one_player_two_id: null,
            team_one_player_three_id: null,
            team_two_player_one_id: 2,
            team_two_player_two_id: null,
            team_two_player_three_id: null,
            team_one_games_won: 2,
            team_two_games_won: 1
          },
          {
            id: 2,
            date: '2023-01-02T12:00:00Z',
            team_one_player_one_id: 2,
            team_one_player_two_id: null,
            team_one_player_three_id: null,
            team_two_player_one_id: 1,
            team_two_player_two_id: null,
            team_two_player_three_id: null,
            team_one_games_won: 3,
            team_two_games_won: 0
          }
        ]);
      }
      return Promise.resolve([]);
    });

    const request = new NextRequest('http://localhost:3000/api/player-trends');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);

    // Alice wins 2, loses 1 on 2023-01-01 -> win% 66.6%
    // Alice wins 0, loses 3 on 2023-01-02 -> total wins 2, total games 6 -> win% 33.3%
    const alice = data.find((p: any) => p.name === 'Alice');
    expect(alice.dailyStats['2023-01-01']).toMatchObject({
      totalWins: 2,
      totalGames: 3,
    });
    expect(alice.dailyStats['2023-01-02']).toMatchObject({
      totalWins: 2,
      totalGames: 6,
    });
  });

  it('fetches matches for lifetime season', async () => {
    mockSql.mockImplementation((queryName) => {
      if (queryName === 'players') return Promise.resolve([]);
      if (queryName === 'matches') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const request = new NextRequest('http://localhost:3000/api/player-trends?season=lifetime');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
    expect(mockSql).toHaveBeenCalledWith('matches');
    expect(mockSql).toHaveBeenCalledWith('players');
  });

  it('fetches matches for current season', async () => {
    mockSql.mockImplementation((queryName) => {
      if (queryName === 'players') return Promise.resolve([]);
      if (queryName === 'matches') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const request = new NextRequest('http://localhost:3000/api/player-trends?season=current');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
    expect(mockSql).toHaveBeenCalledWith('matches');
    expect(mockSql).toHaveBeenCalledWith('players');
  });

  it('fetches matches for a specific numeric season', async () => {
    mockSql.mockImplementation((queryName) => {
      if (queryName === 'players') return Promise.resolve([]);
      if (queryName === 'matches') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const request = new NextRequest('http://localhost:3000/api/player-trends?season=1');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
    expect(mockSql).toHaveBeenCalledWith('matches');
    expect(mockSql).toHaveBeenCalledWith('players');
  });
});
