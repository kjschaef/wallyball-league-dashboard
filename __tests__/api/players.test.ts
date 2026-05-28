import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '../../app/api/players/route';

const mockSql = jest.fn();
jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => mockSql),
}));

const mockCookieStore = {
  get: jest.fn(),
};
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookieStore),
}));

// Helper to create a NextRequest mock that resolves .json() safely
const createMockRequest = (body: any, url: string = 'http://localhost/api/players') => {
  return {
    url,
    json: async () => body,
  } as unknown as Request;
};

const createMockGetRequest = (url: string = 'http://localhost/api/players') => {
  return {
    url,
  } as unknown as Request;
};

describe('/api/players route', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalConsoleError = console.error;
  let mockConsoleError: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = 'mock-database-url';
    mockConsoleError = jest.fn();
    console.error = mockConsoleError;
    mockCookieStore.get.mockReturnValue({ value: 'true' }); // Admin by default
  });

  afterAll(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
    console.error = originalConsoleError;
  });

  describe('GET', () => {
    it('returns players with calculated stats', async () => {
      const mockPlayers = [
        { id: 1, name: 'Alice', start_year: 2020, created_at: '2020-01-01T00:00:00Z' },
        { id: 2, name: 'Bob', start_year: 2021, created_at: '2021-01-01T00:00:00Z' },
      ];

      const mockMatches = [
        {
          id: 1,
          date: '2024-01-01T12:00:00Z',
          team_one_player_one_id: 1, // Alice on team 1
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: 2, // Bob on team 2
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 2,
          team_two_games_won: 1,
        },
      ];

      mockSql.mockImplementation((strings: TemplateStringsArray) => {
        const query = strings.join(' ').toLowerCase();
        if (query.includes('select * from players')) {
          return Promise.resolve(mockPlayers);
        }
        if (query.includes('select * from matches')) {
          return Promise.resolve(mockMatches);
        }
        return Promise.resolve([]);
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);

      const alice = data.find((p: any) => p.name === 'Alice');
      expect(alice.stats).toEqual({
        won: 1, // Won 1 match (team 1 won)
        lost: 0,
        totalGames: 3, // 2 + 1
      });

      const bob = data.find((p: any) => p.name === 'Bob');
      expect(bob.stats).toEqual({
        won: 0,
        lost: 1, // Lost 1 match (team 2 lost)
        totalGames: 3,
      });
    });

    it('returns 500 if database URL is missing', async () => {
      process.env.DATABASE_URL = '';

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch players' });
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('POST', () => {
    it('returns 401 if not admin', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const request = createMockRequest({ name: 'Charlie' });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('returns 400 if name is missing', async () => {
      const request = createMockRequest({ name: '' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Player name is required' });
    });

    it('inserts a new player and returns 201', async () => {
      mockSql.mockResolvedValue([
        { id: 3, name: 'Charlie', start_year: 2024, created_at: '2024-01-01T00:00:00Z' }
      ]);

      const request = createMockRequest({ name: 'Charlie', startYear: 2024 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('Charlie');
      expect(data.stats).toEqual({ won: 0, lost: 0, totalGames: 0, totalMatchTime: 0 });
    });
  });

  describe('PUT', () => {
    it('returns 401 if not admin', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const request = createMockRequest({ id: 1, name: 'Alice Updated' });
      const response = await PUT(request);

      expect(response.status).toBe(401);
    });

    it('returns 400 if id is missing', async () => {
      const request = createMockRequest({ name: 'Alice Updated' });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Player ID is required' });
    });

    it('returns 400 if name is missing', async () => {
      const request = createMockRequest({ id: 1, name: '  ' });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Player name is required' });
    });

    it('updates player and returns updated data', async () => {
      mockSql.mockResolvedValue([
        { id: 1, name: 'Alice Updated', start_year: 2020, created_at: '2020-01-01T00:00:00Z' }
      ]);

      const request = createMockRequest({ id: 1, name: 'Alice Updated' });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Alice Updated');
    });

    it('returns 404 if player not found', async () => {
      mockSql.mockResolvedValue([]);

      const request = createMockRequest({ id: 999, name: 'Nobody' });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Player not found' });
    });
  });

  describe('DELETE', () => {
    it('returns 401 if not admin', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const request = createMockGetRequest('http://localhost/api/players?id=1');
      const response = await DELETE(request);

      expect(response.status).toBe(401);
    });

    it('returns 400 if id is missing', async () => {
      const request = createMockGetRequest('http://localhost/api/players');
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Player ID is required' });
    });

    it('returns 400 if player has existing matches', async () => {
      mockSql.mockResolvedValue([{ match_count: 1 }]);

      const request = createMockGetRequest('http://localhost/api/players?id=1');
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Cannot delete player with existing match records' });
    });

    it('deletes player and returns success if no matches exist', async () => {
      mockSql.mockImplementation((strings: TemplateStringsArray) => {
        const query = strings.join(' ').toLowerCase();
        if (query.includes('select count(*) as match_count')) {
          return Promise.resolve([{ match_count: 0 }]); // No matches
        }
        if (query.includes('delete from players')) {
          return Promise.resolve([{ id: 1 }]); // Successfully deleted
        }
        return Promise.resolve([]);
      });

      const request = createMockGetRequest('http://localhost/api/players?id=1');
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ message: 'Player deleted successfully' });
    });

    it('returns 404 if player not found during deletion', async () => {
      mockSql.mockImplementation((strings: TemplateStringsArray) => {
        const query = strings.join(' ').toLowerCase();
        if (query.includes('select count(*) as match_count')) {
          return Promise.resolve([{ match_count: 0 }]);
        }
        if (query.includes('delete from players')) {
          return Promise.resolve([]); // Not found
        }
        return Promise.resolve([]);
      });

      const request = createMockGetRequest('http://localhost/api/players?id=999');
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Player not found' });
    });
  });
});
