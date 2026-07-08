const mockSql = jest.fn();
const mockGenerateDailySummary = jest.fn();
const mockCalculatePlayerStats = jest.fn();
const mockGetCurrentSeasonByDate = jest.fn();

const createMockSql = () =>
  Object.assign(
    jest.fn().mockImplementation((strings: TemplateStringsArray) => {
      const query = strings.join(' ').replace(/\s+/g, ' ').trim().toLowerCase();

      if (query.includes('select * from matches order by date desc, id desc')) {
        return mockSql('matches');
      }

      if (query.includes('select * from players order by created_at desc')) {
        return mockSql('players');
      }

      if (query.includes('select * from daily_summaries') && query.includes('order by created_at desc')) {
        return mockSql('cached-summary');
      }

      if (query.includes('select id from daily_summaries')) {
        return mockSql('existing-cache');
      }

      if (query.includes('insert into daily_summaries')) {
        return mockSql('insert-cache');
      }

      return mockSql('unknown');
    }),
    {
      transaction: jest.fn(),
    }
  );

jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => createMockSql()),
}));

jest.mock('@/app/lib/openai', () => ({
  generateDailySummary: (...args: unknown[]) => mockGenerateDailySummary(...args),
}));

jest.mock('@/app/lib/stats', () => ({
  calculatePlayerStats: (...args: unknown[]) => mockCalculatePlayerStats(...args),
}));

jest.mock('@/lib/seasons', () => ({
  getCurrentSeasonByDate: (...args: unknown[]) => mockGetCurrentSeasonByDate(...args),
}));

import { GET } from '@/app/api/daily-summary/route';

describe('/api/daily-summary GET', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = 'mock-database-url';
    mockGetCurrentSeasonByDate.mockReturnValue({
      start_date: '2026-01-01T00:00:00.000Z',
      end_date: '2026-03-31T23:59:59.000Z',
    });
    mockSql.mockImplementation(() => Promise.resolve([]));
  });

  afterAll(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('returns a cached summary when the latest match id matches', async () => {
    mockSql.mockImplementation((queryType) => {
      if (queryType === 'matches') {
        return Promise.resolve([
          { id: 5, date: '2026-03-24T01:00:00.000Z' },
        ]);
      }

      if (queryType === 'players') {
        return Promise.resolve([]);
      }

      if (queryType === 'cached-summary') {
        return Promise.resolve([
          { summary: 'Cached summary', last_match_id: '5' },
        ]);
      }

      return Promise.resolve([]);
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ summary: 'Cached summary' });
    expect(mockGenerateDailySummary).not.toHaveBeenCalled();
    expect(mockCalculatePlayerStats).not.toHaveBeenCalled();
  });

  it('generates and caches a fresh summary using lifetime and season stats', async () => {
    const allMatches = [
      { id: 9, date: '2026-03-24T02:00:00.000Z', team_one_games_won: 3, team_two_games_won: 1 },
      { id: 8, date: '2026-03-24T01:00:00.000Z', team_one_games_won: 2, team_two_games_won: 3 },
      { id: 7, date: '2025-12-30T01:00:00.000Z', team_one_games_won: 1, team_two_games_won: 3 },
    ];
    const players = [{ id: 1, name: 'Alice' }];

    mockSql.mockImplementation((queryType) => {
      if (queryType === 'matches') {
        return Promise.resolve(allMatches);
      }

      if (queryType === 'players') {
        return Promise.resolve(players);
      }

      if (queryType === 'cached-summary' || queryType === 'existing-cache' || queryType === 'insert-cache') {
        return Promise.resolve([]);
      }

      return Promise.resolve([]);
    });

    mockCalculatePlayerStats
      .mockResolvedValueOnce([{ name: 'Alice', record: { totalGames: 20 }, winPercentage: 0.8 }])
      .mockResolvedValueOnce([{ name: 'Alice', record: { totalGames: 4 }, winPercentage: 0.5 }]);
    mockGenerateDailySummary.mockResolvedValue('Fresh summary');

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ summary: 'Fresh summary' });
    expect(mockGenerateDailySummary).toHaveBeenCalledWith(
      [
        expect.objectContaining({ id: 9 }),
        expect.objectContaining({ id: 8 }),
      ],
      [
        {
          name: 'Alice',
          seasonGames: 4,
          lifetimeGames: 20,
          winPercentage: 0.5,
        },
      ]
    );
    expect(mockSql).toHaveBeenCalledWith('insert-cache');
  });

  it('falls back to season stats when lifetime aggregation fails', async () => {
    mockSql.mockImplementation((queryType) => {
      if (queryType === 'matches') {
        return Promise.resolve([
          { id: 4, date: '2026-03-24T02:00:00.000Z', team_one_games_won: 3, team_two_games_won: 1 },
        ]);
      }

      if (queryType === 'players') {
        return Promise.resolve([{ id: 1, name: 'Alice' }]);
      }

      if (queryType === 'cached-summary' || queryType === 'existing-cache' || queryType === 'insert-cache') {
        return Promise.resolve([]);
      }

      return Promise.resolve([]);
    });

    mockCalculatePlayerStats
      .mockRejectedValueOnce(new Error('lifetime failed'))
      .mockResolvedValueOnce([{ name: 'Alice', record: { totalGames: 6 }, winPercentage: 0.66 }]);
    mockGenerateDailySummary.mockResolvedValue('Fallback summary');

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ summary: 'Fallback summary' });
    expect(mockGenerateDailySummary).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 4 })],
      [
        {
          name: 'Alice',
          seasonGames: 6,
          lifetimeGames: 6,
          winPercentage: 0.66,
        },
      ]
    );
  });

  it('returns 500 when the route cannot initialize', async () => {
    delete process.env.DATABASE_URL;

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to generate summary' });
  });
});
