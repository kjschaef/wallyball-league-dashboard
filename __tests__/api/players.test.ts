import { GET, POST, PUT, DELETE } from '@/app/api/players/route';

const mockSql = jest.fn();

const mockCookieStore = {
  get: jest.fn(),
};

const createMockSql = () => {
  return Object.assign(
    jest.fn().mockImplementation((strings: TemplateStringsArray, ...values: unknown[]) => {
      const query = strings.join('').toLowerCase();
      if (query.includes('select * from players')) {
        return mockSql('players', values, query);
      } else if (query.includes('select id from matches')) {
        return mockSql('player_matches', values, query);
      } else if (query.includes('select * from matches')) {
        return mockSql('matches');
      } else if (query.includes('insert into players')) {
        return mockSql('insert', values);
      } else if (query.includes('update players')) {
        return mockSql('update', values, query);
      } else if (query.includes('delete from weekly_signups')) {
        return mockSql('delete_signups', values);
      } else if (query.includes('delete from weekly_unavailable')) {
        return mockSql('delete_unavailable', values);
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
            { id: 1, name: 'Alice', start_year: 2024, created_at: '2024-01-01T00:00:00Z', is_active: true, deleted_at: null },
            { id: 2, name: 'Bob', start_year: 2024, created_at: '2024-01-01T00:00:00Z', is_active: false, deleted_at: '2024-01-02T00:00:00Z' }
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
      expect(alice.lastGameDate).toBe('2024-01-02T00:00:00.000Z');
      expect(alice.isActive).toBe(true);
      expect(alice.stats).toEqual({
        won: 1,
        lost: 0,
        totalGames: 3
      });

      const bob = data.find((p: any) => p.name === 'Bob');
      expect(bob.lastGameDate).toBe('2024-01-02T00:00:00.000Z');
      expect(bob.isActive).toBe(false);
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
      const mockPlayer = { id: 3, name: 'Charlie', start_year: 2024, created_at: '2024-02-01T00:00:00Z', is_active: true };

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
        isActive: true,
        deletedAt: null,
        matches: [],
        lastGameDate: null,
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

  describe('PUT', () => {
    it('updates player name, startYear, and isActive status', async () => {
      let updateQuery = '';
      let updateValues: unknown[] = [];
      mockSql.mockImplementation((queryType, values, query) => {
        if (queryType === 'players') {
          return Promise.resolve([{ id: 1, name: 'Alice', start_year: 2024, is_active: true, created_at: '2024-01-01' }]);
        }
        if (queryType === 'update') {
          updateQuery = query;
          updateValues = values;
          return Promise.resolve([{
            id: 1,
            name: 'Alice Updated',
            start_year: 2025,
            is_active: false,
            deleted_at: new Date('2026-01-01'),
            created_at: '2024-01-01'
          }]);
        }
        return Promise.resolve([]);
      });

      const request = {
        json: async () => ({ id: 1, name: 'Alice Updated', startYear: 2025, isActive: false }),
      } as Request;

      const response = await PUT(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toBe('Alice Updated');
      expect(data.isActive).toBe(false);
      expect(updateQuery).toContain('is_active =');
      expect(updateValues).toContain(false);
    });

    it('returns 404 if player not found', async () => {
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'players') {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      const request = {
        json: async () => ({ id: 999, name: 'Nonexistent' }),
      } as Request;

      const response = await PUT(request);
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE', () => {
    it('returns 401 if unauthorized', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'false' });

      const request = { url: 'http://localhost/api/players?id=1' } as Request;
      const response = await DELETE(request);
      expect(response.status).toBe(401);
    });

    it('returns 400 if player id is missing', async () => {
      const request = { url: 'http://localhost/api/players' } as Request;
      const response = await DELETE(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toEqual({ error: 'Player ID is required' });
    });

    it('marks player inactive when player has match history and cleans up signups/unavailabilities', async () => {
      let updateExecuted = false;
      let deleteSignupsExecuted = false;
      let deleteUnavailableExecuted = false;

      mockSql.mockImplementation((queryType, values, query) => {
        if (queryType === 'players') {
          return Promise.resolve([{ id: 1, name: 'Alice', is_active: true }]);
        }
        if (queryType === 'player_matches') {
          return Promise.resolve([{ id: 10 }]);
        }
        if (queryType === 'update') {
          updateExecuted = true;
          expect(query).toContain('is_active = false');
          expect(query).toContain('deleted_at = now()');
          return Promise.resolve([{ id: 1, name: 'Alice', is_active: false, deleted_at: new Date() }]);
        }
        if (queryType === 'delete_signups') {
          deleteSignupsExecuted = true;
          return Promise.resolve([]);
        }
        if (queryType === 'delete_unavailable') {
          deleteUnavailableExecuted = true;
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      const request = { url: 'http://localhost/api/players?id=1' } as Request;
      const response = await DELETE(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ message: 'Player deleted successfully' });
      expect(updateExecuted).toBe(true);
      expect(deleteSignupsExecuted).toBe(true);
      expect(deleteUnavailableExecuted).toBe(true);
    });

    it('hard-deletes player when player has 0 matches', async () => {
      let deleteExecuted = false;

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'players') {
          return Promise.resolve([{ id: 2, name: 'Bob' }]);
        }
        if (queryType === 'player_matches') {
          return Promise.resolve([]); // 0 matches
        }
        if (queryType === 'delete') {
          deleteExecuted = true;
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      const request = { url: 'http://localhost/api/players?id=2' } as Request;
      const response = await DELETE(request);
      expect(response.status).toBe(200);
      expect(deleteExecuted).toBe(true);
    });

    it('returns 404 if player not found', async () => {
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'players') {
          return Promise.resolve([]); // player not found
        }
        return Promise.resolve([]);
      });

      const request = { url: 'http://localhost/api/players?id=999' } as Request;
      const response = await DELETE(request);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toEqual({ error: 'Player not found' });
    });
  });
});
