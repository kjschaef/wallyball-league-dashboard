import { NextRequest } from 'next/server';
import { GET } from '@/app/api/matches/route';

// Mock the neon database connection
const mockSql = jest.fn();

// Create a mock function that handles template literals properly
const createMockSql = () => {
  return Object.assign(
    jest.fn().mockImplementation((strings: TemplateStringsArray, ...values: any[]) => {
      const query = strings.join('');
      if (query.includes('SELECT team_one_games_won, team_two_games_won FROM matches')) {
        return mockSql('stats');
      } else if (query.includes('SELECT * FROM matches ORDER BY date DESC LIMIT')) {
        return mockSql('matches-limit');
      } else if (query.includes('SELECT * FROM matches ORDER BY date DESC')) {
        return mockSql('matches');
      } else if (query.includes('SELECT * FROM players')) {
        return mockSql('players');
      }
      return mockSql('unknown');
    }),
    {
      // Additional methods that might be used by neon
      transaction: jest.fn(),
    }
  );
};

jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => createMockSql()),
}));

// Mock Next.js environment
process.env.DATABASE_URL = 'mock-database-url';

describe('/api/matches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET without stats parameter', () => {
    const mockMatches = [
      {
        id: 1,
        team_one_player_one_id: 1,
        team_one_player_two_id: 2,
        team_one_player_three_id: null,
        team_two_player_one_id: 3,
        team_two_player_two_id: 4,
        team_two_player_three_id: null,
        team_one_games_won: 2,
        team_two_games_won: 1,
        date: '2023-01-01T00:00:00Z'
      },
      {
        id: 2,
        team_one_player_one_id: 2,
        team_one_player_two_id: 3,
        team_one_player_three_id: 1,
        team_two_player_one_id: 4,
        team_two_player_two_id: 5,
        team_two_player_three_id: 6,
        team_one_games_won: 3,
        team_two_games_won: 2,
        date: '2023-01-02T00:00:00Z'
      }
    ];

    const mockPlayers = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
      { id: 4, name: 'Diana' },
      { id: 5, name: 'Eve' },
      { id: 6, name: 'Frank' }
    ];

    beforeEach(() => {
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'matches' || queryType === 'matches-limit') {
          return Promise.resolve(mockMatches);
        }
        if (queryType === 'players') {
          return Promise.resolve(mockPlayers);
        }
        return Promise.resolve([]);
      });
    });

    it('should return formatted matches with player names', async () => {
      const request = new NextRequest('http://localhost:3000/api/matches');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0]).toMatchObject({
        id: 1,
        teamOnePlayerOneId: 1,
        teamOnePlayerTwoId: 2,
        teamOnePlayerThreeId: null,
        teamTwoPlayerOneId: 3,
        teamTwoPlayerTwoId: 4,
        teamTwoPlayerThreeId: null,
        teamOneGamesWon: 2,
        teamTwoGamesWon: 1,
        teamOnePlayers: ['Alice', 'Bob'],
        teamTwoPlayers: ['Charlie', 'Diana']
      });
    });

    it('should respect limit parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/matches?limit=1');
      await GET(request);

      expect(mockSql).toHaveBeenCalledWith('matches-limit');
    });
  });

  describe('GET with stats=true parameter', () => {
    beforeEach(() => {
      mockSql.mockClear();
    });

    it('should return correct statistics for normal matches', async () => {
      const mockMatchesForStats = [
        { team_one_games_won: 2, team_two_games_won: 1 },
        { team_one_games_won: 3, team_two_games_won: 2 },
        { team_one_games_won: 1, team_two_games_won: 3 },
      ];

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'stats') {
          return Promise.resolve(mockMatchesForStats);
        }
        return Promise.resolve([]);
      });

      const request = new NextRequest('http://localhost:3000/api/matches?stats=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        totalMatches: 3,
        totalGames: 12, // (2+1) + (3+2) + (1+3) = 12
        avgGamesPerMatch: 4.0
      });

      // Verify the correct query was made
      expect(mockSql).toHaveBeenCalledWith('stats');
    });

    it('should handle null values correctly', async () => {
      const mockMatchesWithNulls = [
        { team_one_games_won: 2, team_two_games_won: 1 },
        { team_one_games_won: null, team_two_games_won: 2 },
        { team_one_games_won: 1, team_two_games_won: null },
        { team_one_games_won: null, team_two_games_won: null },
      ];

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'stats') {
          return Promise.resolve(mockMatchesWithNulls);
        }
        return Promise.resolve([]);
      });

      const request = new NextRequest('http://localhost:3000/api/matches?stats=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        totalMatches: 4,
        totalGames: 6, // 2+1 + 0+2 + 1+0 + 0+0 = 6
        avgGamesPerMatch: 1.5
      });
    });

    it('should handle empty database correctly', async () => {
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'stats') {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      const request = new NextRequest('http://localhost:3000/api/matches?stats=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        totalMatches: 0,
        totalGames: 0,
        avgGamesPerMatch: 0
      });
    });

    it('should handle single match correctly', async () => {
      const mockSingleMatch = [
        { team_one_games_won: 3, team_two_games_won: 1 }
      ];

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'stats') {
          return Promise.resolve(mockSingleMatch);
        }
        return Promise.resolve([]);
      });

      const request = new NextRequest('http://localhost:3000/api/matches?stats=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        totalMatches: 1,
        totalGames: 4,
        avgGamesPerMatch: 4.0
      });
    });
  });

  describe('Data consistency test - the bug this would have caught', () => {
    it('should return identical counts whether using stats=true or calculating from match list', async () => {
      // Mock data that represents the real scenario
      const mockRealMatches = [
        { team_one_games_won: 2, team_two_games_won: 1 },
        { team_one_games_won: 3, team_two_games_won: 2 },
        { team_one_games_won: 1, team_two_games_won: 3 },
        { team_one_games_won: 2, team_two_games_won: 0 },
        { team_one_games_won: 1, team_two_games_won: 2 },
      ];

      const mockFullMatches = mockRealMatches.map((match, index) => ({
        id: index + 1,
        ...match,
        team_one_player_one_id: 1,
        team_one_player_two_id: 2,
        team_one_player_three_id: null,
        team_two_player_one_id: 3,
        team_two_player_two_id: 4,
        team_two_player_three_id: null,
        date: `2023-01-0${index + 1}T00:00:00Z`
      }));

      const mockPlayers = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'Diana' }
      ];

      // Test stats=true endpoint
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'stats') {
          return Promise.resolve(mockRealMatches);
        }
        return Promise.resolve([]);
      });
      
      const statsRequest = new NextRequest('http://localhost:3000/api/matches?stats=true');
      const statsResponse = await GET(statsRequest);
      const statsData = await statsResponse.json();

      // Test regular endpoint and calculate stats manually
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'matches') {
          return Promise.resolve(mockFullMatches);
        }
        if (queryType === 'players') {
          return Promise.resolve(mockPlayers);
        }
        return Promise.resolve([]);
      });

      const matchesRequest = new NextRequest('http://localhost:3000/api/matches');
      const matchesResponse = await GET(matchesRequest);
      const matchesData = await matchesResponse.json();

      // Calculate stats from matches data
      const calculatedTotalMatches = matchesData.length;
      const calculatedTotalGames = matchesData.reduce(
        (sum: number, match: any) => sum + match.teamOneGamesWon + match.teamTwoGamesWon, 
        0
      );
      const calculatedAvgGames = calculatedTotalMatches > 0 
        ? Number((calculatedTotalGames / calculatedTotalMatches).toFixed(1)) 
        : 0;

      // These should be identical - this test would have caught the original bug
      expect(statsData.totalMatches).toBe(calculatedTotalMatches);
      expect(statsData.totalGames).toBe(calculatedTotalGames);
      expect(statsData.avgGamesPerMatch).toBe(calculatedAvgGames);

      // Additional verification of expected values
      expect(statsData.totalMatches).toBe(5);
      expect(statsData.totalGames).toBe(17); // (2+1) + (3+2) + (1+3) + (2+0) + (1+2) = 17
      expect(calculatedTotalGames).toBe(17);
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      mockSql.mockImplementation(() => {
        return Promise.reject(new Error('Database connection failed'));
      });

      const request = new NextRequest('http://localhost:3000/api/matches');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Failed to fetch matches' });
    });

    it('should handle missing DATABASE_URL', async () => {
      const originalUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;

      const request = new NextRequest('http://localhost:3000/api/matches');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Failed to fetch matches' });

      // Restore environment variable
      process.env.DATABASE_URL = originalUrl;
    });

    it('should handle stats=true with database error', async () => {
      mockSql.mockImplementation(() => {
        return Promise.reject(new Error('Stats query failed'));
      });

      const request = new NextRequest('http://localhost:3000/api/matches?stats=true');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Failed to fetch matches' });
    });
  });

  describe('Edge cases', () => {
    it('should handle malformed limit parameter gracefully', async () => {
      const mockMatches = [{ id: 1, team_one_games_won: 2, team_two_games_won: 1 }];
      const mockPlayers = [{ id: 1, name: 'Alice' }];

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'matches') {
          return Promise.resolve(mockMatches);
        }
        if (queryType === 'players') {
          return Promise.resolve(mockPlayers);
        }
        return Promise.resolve([]);
      });

      const request = new NextRequest('http://localhost:3000/api/matches?limit=invalid');
      const response = await GET(request);

      expect(response.status).toBe(200);
      // Should return all matches when limit is invalid
      expect(mockSql).toHaveBeenCalledWith('matches');
    });

    it('should handle negative limit parameter', async () => {
      const mockMatches = [{ id: 1, team_one_games_won: 2, team_two_games_won: 1 }];
      const mockPlayers = [{ id: 1, name: 'Alice' }];

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'matches') {
          return Promise.resolve(mockMatches);
        }
        if (queryType === 'players') {
          return Promise.resolve(mockPlayers);
        }
        return Promise.resolve([]);
      });

      const request = new NextRequest('http://localhost:3000/api/matches?limit=-5');
      const response = await GET(request);

      expect(response.status).toBe(200);
      // Should return all matches when limit is negative
      expect(mockSql).toHaveBeenCalledWith('matches');
    });

    it('should handle stats parameter with different values', async () => {
      const mockMatches = [{ team_one_games_won: 2, team_two_games_won: 1 }];

      // Test stats=false (should not trigger stats mode)
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'matches') {
          return Promise.resolve(mockMatches);
        }
        if (queryType === 'players') {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      const request = new NextRequest('http://localhost:3000/api/matches?stats=false');
      const response = await GET(request);

      expect(response.status).toBe(200);
      // Should call the regular match query, not stats query
      expect(mockSql).toHaveBeenCalledWith('matches');
    });
  });
});
