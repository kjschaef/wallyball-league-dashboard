import { GET, POST } from '@/app/api/players/route';

const mockSql = jest.fn();

const mockCookieStore = {
  get: jest.fn(),
};

const createMockSql = () => {
  return Object.assign(
    jest.fn().mockImplementation((strings: TemplateStringsArray, ...values: unknown[]) => {
      const query = strings.join('').toLowerCase();
      if (query.includes('select * from players')) {
        return mockSql('players');
      } else if (query.includes('select * from matches')) {
        return mockSql('matches');
      } else if (query.includes('insert into players')) {
        return mockSql('insert', values);
      } else if (query.includes('update players')) {
        return mockSql('update', values);
      } else if (query.includes('select count(*) as match_count')) {
        return mockSql('check_matches', values);
      } else if (query.includes('delete from players')) {
        return mockSql('delete', values);
      }
      return mockSql('unknown');
    }),
    {
      transaction: jest.fn(),
    }
  );
};

jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => createMockSql()),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookieStore),
}));

describe('/api/players', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = 'mock-database-url';
    mockCookieStore.get.mockReturnValue({ value: 'true' }); // Admin by default
  });

  afterAll(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  describe('GET', () => {
    it('returns players with calculated stats', async () => {
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'players') {
          return Promise.resolve([
            { id: 1, name: 'Alice', start_year: 2024, created_at: '2024-01-01T00:00:00Z' },
            { id: 2, name: 'Bob', start_year: 2024, created_at: '2024-01-01T00:00:00Z' }
          ]);
        }
        if (queryType === 'matches') {
          return Promise.resolve([
            {
              id: 1,
              date: '2024-01-02T00:00:00Z',
              team_one_player_one_id: 1,
              team_one_player_two_id: null,
              team_one_player_three_id: null,
              team_two_player_one_id: 2,
              team_two_player_two_id: null,
              team_two_player_three_id: null,
              team_one_games_won: 2,
              team_two_games_won: 1,
            }
          ]);
        }
        return Promise.resolve([]);
      });

      const response = await GET();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveLength(2);

      const alice = data.find((p: any) => p.name === 'Alice');
      expect(alice.stats).toEqual({
        won: 1,
        lost: 0,
        totalGames: 3
      });

      const bob = data.find((p: any) => p.name === 'Bob');
      expect(bob.stats).toEqual({
        won: 0,
        lost: 1,
        totalGames: 3
      });
    });

    it('returns 500 when DATABASE_URL is missing', async () => {
      const dbUrl = process.env.DATABASE_URL;
      try {
        delete process.env.DATABASE_URL;

        // Mock console.error
        const originalConsoleError = console.error;
        console.error = jest.fn();

        const response = await GET();
        expect(response.status).toBe(500);

        const data = await response.json();
        expect(data).toEqual({ error: 'Failed to fetch players' });

        console.error = originalConsoleError;
      } finally {
        process.env.DATABASE_URL = dbUrl;
      }
    });
  });

  describe('POST', () => {
    it('creates a new player', async () => {
      const mockPlayer = { id: 3, name: 'Charlie', start_year: 2024, created_at: '2024-02-01T00:00:00Z' };

      mockSql.mockImplementation((queryType, values) => {
        if (queryType === 'insert') {
          return Promise.resolve([mockPlayer]);
        }
        return Promise.resolve([]);
      });

      const request = {
        json: async () => ({ name: 'Charlie', startYear: 2024 }),
      } as Request;

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toEqual({
        id: 3,
        name: 'Charlie',
        startYear: 2024,
        createdAt: '2024-02-01T00:00:00.000Z',
        matches: [],
        stats: { won: 0, lost: 0, totalGames: 0, totalMatchTime: 0 }
      });
    });

    it('returns 400 if name is missing', async () => {
      const request = {
        json: async () => ({ startYear: 2024 }),
      } as Request;

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toEqual({ error: 'Player name is required' });
    });

    it('returns 401 if unauthorized', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'false' });

      const request = {
        json: async () => ({ name: 'Charlie' }),
      } as Request;

      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });
});
