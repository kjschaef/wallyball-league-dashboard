import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/players/route';
import { cookies } from 'next/headers';

// Mock the neon database connection
const mockSql = jest.fn();

// Create a mock function that handles template literals properly
const createMockSql = () => {
  return Object.assign(
    jest.fn().mockImplementation((strings: TemplateStringsArray, ..._values: unknown[]) => {
      const query = strings.join('').toLowerCase();
      if (query.includes('select * from players')) {
        return mockSql('players');
      } else if (query.includes('select * from matches')) {
        return mockSql('matches');
      } else if (query.includes('insert into players')) {
        return mockSql('insert_players');
      } else if (query.includes('update players')) {
        return mockSql('update_players');
      } else if (query.includes('select count(*) as match_count')) {
        return mockSql('match_count');
      } else if (query.includes('delete from players')) {
        return mockSql('delete_players');
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

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

const mockCookies = {
  get: jest.fn(),
};

describe('Players API', () => {
  let originalDbUrl: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    originalDbUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgres://fake:fake@fake.neon.tech/fake';
    (cookies as jest.Mock).mockResolvedValue(mockCookies);
  });

  afterEach(() => {
    if (originalDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDbUrl;
    }
  });

  describe('GET /api/players', () => {
    it('returns players with their calculated stats', async () => {
      // Mock data
      const mockPlayers = [
        { id: 1, name: 'Alice', start_year: 2022, created_at: '2023-01-01T00:00:00.000Z' },
        { id: 2, name: 'Bob', start_year: 2023, created_at: '2023-01-02T00:00:00.000Z' }
      ];

      const mockMatches = [
        {
          id: 1,
          date: '2023-01-15T00:00:00.000Z',
          team_one_player_one_id: 1, // Alice
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: 2, // Bob
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 2,
          team_two_games_won: 1
        }
      ];

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'players') return Promise.resolve(mockPlayers);
        if (queryType === 'matches') return Promise.resolve(mockMatches);
        return Promise.resolve([]);
      });

      const response = await GET();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveLength(2);

      // Alice won the match
      const alice = data.find((p: any) => p.name === 'Alice');
      expect(alice.stats.won).toBe(1);
      expect(alice.stats.lost).toBe(0);
      expect(alice.stats.totalGames).toBe(3);

      // Bob lost the match
      const bob = data.find((p: any) => p.name === 'Bob');
      expect(bob.stats.won).toBe(0);
      expect(bob.stats.lost).toBe(1);
      expect(bob.stats.totalGames).toBe(3);
    });

    it('returns 500 when DATABASE_URL is missing', async () => {
      delete process.env.DATABASE_URL;
      const response = await GET();
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/players', () => {
    it('creates a new player when admin token is provided', async () => {
      mockCookies.get.mockReturnValue({ value: 'true' });

      const mockNewPlayer = [
        { id: 3, name: 'Charlie', start_year: 2024, created_at: '2024-01-01T00:00:00.000Z' }
      ];
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'insert_players') return Promise.resolve(mockNewPlayer);
        return Promise.resolve([]);
      });

      const mockRequest = {
        json: async () => ({ name: 'Charlie', startYear: 2024 })
      } as Request;

      const response = await POST(mockRequest);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.name).toBe('Charlie');
      expect(data.startYear).toBe(2024);
      expect(data.stats).toEqual({ won: 0, lost: 0, totalGames: 0, totalMatchTime: 0 });
    });

    it('returns 401 when admin token is missing', async () => {
      mockCookies.get.mockReturnValue(undefined);

      const mockRequest = {
        json: async () => ({ name: 'Charlie', startYear: 2024 })
      } as Request;

      const response = await POST(mockRequest);
      expect(response.status).toBe(401);
    });

    it('returns 400 when name is missing', async () => {
      mockCookies.get.mockReturnValue({ value: 'true' });

      const mockRequest = {
        json: async () => ({ startYear: 2024 })
      } as Request;

      const response = await POST(mockRequest);
      expect(response.status).toBe(400);
    });

    it('returns 500 when DATABASE_URL is missing', async () => {
      mockCookies.get.mockReturnValue({ value: 'true' });
      delete process.env.DATABASE_URL;

      const mockRequest = {
        json: async () => ({ name: 'Charlie', startYear: 2024 })
      } as Request;

      const response = await POST(mockRequest);
      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/players', () => {
    it('updates a player when admin token is provided', async () => {
      mockCookies.get.mockReturnValue({ value: 'true' });

      const mockUpdatedPlayer = [
        { id: 1, name: 'Alice Updated', start_year: 2022, created_at: '2023-01-01T00:00:00.000Z' }
      ];
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'update_players') return Promise.resolve(mockUpdatedPlayer);
        return Promise.resolve([]);
      });

      const mockRequest = {
        json: async () => ({ id: 1, name: 'Alice Updated', startYear: 2022 })
      } as Request;

      const response = await PUT(mockRequest);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toBe('Alice Updated');
    });

    it('returns 404 when player is not found', async () => {
      mockCookies.get.mockReturnValue({ value: 'true' });

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'update_players') return Promise.resolve([]);
        return Promise.resolve([]);
      });

      const mockRequest = {
        json: async () => ({ id: 999, name: 'Ghost' })
      } as Request;

      const response = await PUT(mockRequest);
      expect(response.status).toBe(404);
    });

    it('returns 401 when admin token is missing', async () => {
      mockCookies.get.mockReturnValue(undefined);

      const mockRequest = {
        json: async () => ({ id: 1, name: 'Alice Updated' })
      } as Request;

      const response = await PUT(mockRequest);
      expect(response.status).toBe(401);
    });

    it('returns 400 when id is missing', async () => {
      mockCookies.get.mockReturnValue({ value: 'true' });

      const mockRequest = {
        json: async () => ({ name: 'Alice Updated' })
      } as Request;

      const response = await PUT(mockRequest);
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/players', () => {
    it('deletes a player when admin token is provided and player has no matches', async () => {
      mockCookies.get.mockReturnValue({ value: 'true' });

      const mockDeletedPlayer = [
        { id: 3, name: 'Charlie', start_year: 2024, created_at: '2024-01-01T00:00:00.000Z' }
      ];
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'match_count') return Promise.resolve([{ match_count: 0 }]);
        if (queryType === 'delete_players') return Promise.resolve(mockDeletedPlayer);
        return Promise.resolve([]);
      });

      const mockRequest = {
        url: 'http://localhost/api/players?id=3'
      } as Request;

      const response = await DELETE(mockRequest);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toBe('Player deleted successfully');
    });

    it('returns 400 when player has existing match records', async () => {
      mockCookies.get.mockReturnValue({ value: 'true' });

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'match_count') return Promise.resolve([{ match_count: 5 }]);
        return Promise.resolve([]);
      });

      const mockRequest = {
        url: 'http://localhost/api/players?id=1'
      } as Request;

      const response = await DELETE(mockRequest);
      expect(response.status).toBe(400);
    });

    it('returns 404 when player is not found to delete', async () => {
      mockCookies.get.mockReturnValue({ value: 'true' });

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'match_count') return Promise.resolve([{ match_count: 0 }]);
        if (queryType === 'delete_players') return Promise.resolve([]);
        return Promise.resolve([]);
      });

      const mockRequest = {
        url: 'http://localhost/api/players?id=999'
      } as Request;

      const response = await DELETE(mockRequest);
      expect(response.status).toBe(404);
    });

    it('returns 401 when admin token is missing', async () => {
      mockCookies.get.mockReturnValue(undefined);

      const mockRequest = {
        url: 'http://localhost/api/players?id=1'
      } as Request;

      const response = await DELETE(mockRequest);
      expect(response.status).toBe(401);
    });

    it('returns 400 when id is missing', async () => {
      mockCookies.get.mockReturnValue({ value: 'true' });

      const mockRequest = {
        url: 'http://localhost/api/players'
      } as Request;

      const response = await DELETE(mockRequest);
      expect(response.status).toBe(400);
    });
  });
});
