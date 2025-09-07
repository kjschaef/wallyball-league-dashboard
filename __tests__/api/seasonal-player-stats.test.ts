import { NextRequest } from 'next/server';
import { GET } from '@/app/api/player-stats/route';

// Mock the neon database connection
const mockSql = jest.fn();

const createMockSql = () => {
  return Object.assign(
    jest.fn().mockImplementation((strings: TemplateStringsArray, ...values: any[]) => {
      const query = strings.join('').toLowerCase();
      if (query.includes('select * from players')) {
        return mockSql('players');
      } else if (query.includes('select * from matches')) {
        return mockSql('matches');
      } else if (query.includes('select * from seasons')) {
        return mockSql('seasons');
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

// Mock the inactivity penalty calculation
jest.mock('@/lib/inactivity-penalty', () => ({
  calculateInactivityPenalty: jest.fn().mockReturnValue(0),
  calculateSeasonalInactivityPenalty: jest.fn().mockReturnValue(0),
}));

process.env.DATABASE_URL = 'mock-database-url';

describe('/api/player-stats with seasonal filtering', () => {
  const mockPlayers = [
    { id: 1, name: 'Alice', start_year: 2020, created_at: '2020-01-01' },
    { id: 2, name: 'Bob', start_year: 2020, created_at: '2020-01-01' },
  ];

  const mockSeasons = [
    {
      id: 1,
      name: '2025 Q1',
      start_date: '2025-01-01',
      end_date: '2025-03-31',
      is_active: false
    },
    {
      id: 2,
      name: '2025 Q2',
      start_date: '2025-04-01',
      end_date: '2025-06-30',
      is_active: false
    },
    {
      id: 3,
      name: '2025 Q3',
      start_date: '2025-07-01',
      end_date: '2025-09-30',
      is_active: true
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Seasonal filtering', () => {
    it('should filter matches by season when season parameter is provided', async () => {
      const allMatches = [
        // Q1 matches
        {
          id: 1,
          team_one_player_one_id: 1,
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: 2,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 3,
          team_two_games_won: 1,
          date: '2025-01-15T10:00:00.000Z',
          season_id: 1
        },
        // Q2 matches
        {
          id: 2,
          team_one_player_one_id: 1,
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: 2,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 2,
          team_two_games_won: 3,
          date: '2025-05-15T10:00:00.000Z',
          season_id: 2
        },
        // Q3 matches
        {
          id: 3,
          team_one_player_one_id: 1,
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: 2,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 4,
          team_two_games_won: 1,
          date: '2025-08-15T10:00:00.000Z',
          season_id: 3
        }
      ];

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'players') {
          return Promise.resolve(mockPlayers);
        }
        if (queryType === 'seasons') {
          return Promise.resolve(mockSeasons);
        }
        if (queryType === 'matches') {
          // Return only Q3 matches when season=3 is requested
          return Promise.resolve(allMatches.filter(match => match.season_id === 3));
        }
        return Promise.resolve([]);
      });

      const request = new NextRequest('http://localhost:3000/api/player-stats?season=3');
      const response = await GET(request);
      const playerStats = await response.json();

      const alice = playerStats.find((p: any) => p.name === 'Alice');
      const bob = playerStats.find((p: any) => p.name === 'Bob');

      // Alice should only have Q3 games (4 wins, 1 loss)
      expect(alice.record.wins).toBe(4);
      expect(alice.record.losses).toBe(1);
      expect(alice.record.totalGames).toBe(5);

      // Bob should only have Q3 games (1 win, 4 losses)
      expect(bob.record.wins).toBe(1);
      expect(bob.record.losses).toBe(4);
      expect(bob.record.totalGames).toBe(5);
    });

    it('should return all matches when no season parameter is provided (lifetime stats)', async () => {
      const allMatches = [
        {
          id: 1,
          team_one_player_one_id: 1,
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: 2,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 3,
          team_two_games_won: 1,
          date: '2025-01-15T10:00:00.000Z',
          season_id: 1
        },
        {
          id: 2,
          team_one_player_one_id: 1,
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: 2,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 2,
          team_two_games_won: 3,
          date: '2025-05-15T10:00:00.000Z',
          season_id: 2
        }
      ];

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'players') {
          return Promise.resolve(mockPlayers);
        }
        if (queryType === 'matches') {
          return Promise.resolve(allMatches);
        }
        return Promise.resolve([]);
      });

      const request = new NextRequest('http://localhost:3000/api/player-stats');
      const response = await GET(request);
      const playerStats = await response.json();

      const alice = playerStats.find((p: any) => p.name === 'Alice');

      // Alice should have all games across seasons (3+2=5 wins, 1+3=4 losses)
      expect(alice.record.wins).toBe(5);
      expect(alice.record.losses).toBe(4);
      expect(alice.record.totalGames).toBe(9);
    });

    it('should handle "current" season parameter', async () => {
      const currentSeasonMatches = [
        {
          id: 3,
          team_one_player_one_id: 1,
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: 2,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 4,
          team_two_games_won: 1,
          date: '2025-08-15T10:00:00.000Z',
          season_id: 3
        }
      ];

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'players') {
          return Promise.resolve(mockPlayers);
        }
        if (queryType === 'seasons') {
          return Promise.resolve(mockSeasons);
        }
        if (queryType === 'matches') {
          return Promise.resolve(currentSeasonMatches);
        }
        return Promise.resolve([]);
      });

      const request = new NextRequest('http://localhost:3000/api/player-stats?season=current');
      const response = await GET(request);
      const playerStats = await response.json();

      const alice = playerStats.find((p: any) => p.name === 'Alice');
      
      // Should return current season stats (Q3)
      expect(alice.record.wins).toBe(4);
      expect(alice.record.losses).toBe(1);
      expect(alice.record.totalGames).toBe(5);
    });

    it('should return 400 error for invalid season parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/player-stats?season=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid season parameter');
    });

    it('should return empty stats when no matches exist for specified season', async () => {
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'players') {
          return Promise.resolve(mockPlayers);
        }
        if (queryType === 'seasons') {
          return Promise.resolve(mockSeasons);
        }
        if (queryType === 'matches') {
          return Promise.resolve([]); // No matches for this season
        }
        return Promise.resolve([]);
      });

      const request = new NextRequest('http://localhost:3000/api/player-stats?season=1');
      const response = await GET(request);
      const playerStats = await response.json();

      expect(response.status).toBe(200);
      playerStats.forEach((player: any) => {
        expect(player.record.wins).toBe(0);
        expect(player.record.losses).toBe(0);
        expect(player.record.totalGames).toBe(0);
        expect(player.streak.count).toBe(0);
      });
    });
  });

  describe('Seasonal streak calculations', () => {
    it('should calculate streaks within season boundaries only', async () => {
      const mockMatches = [
        // Week 1 Q3
        {
          id: 1,
          team_one_player_one_id: 1,
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: 2,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 3,
          team_two_games_won: 1,
          date: '2025-07-07T10:00:00.000Z', // Monday week 1 of Q3
          season_id: 3
        },
        // Week 2 Q3
        {
          id: 2,
          team_one_player_one_id: 1,
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: 2,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 2,
          team_two_games_won: 2,
          date: '2025-07-14T10:00:00.000Z', // Monday week 2 of Q3
          season_id: 3
        }
      ];

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'players') {
          return Promise.resolve(mockPlayers);
        }
        if (queryType === 'seasons') {
          return Promise.resolve(mockSeasons);
        }
        if (queryType === 'matches') {
          return Promise.resolve(mockMatches);
        }
        return Promise.resolve([]);
      });

      const request = new NextRequest('http://localhost:3000/api/player-stats?season=3');
      const response = await GET(request);
      const playerStats = await response.json();

      const alice = playerStats.find((p: any) => p.name === 'Alice');
      const bob = playerStats.find((p: any) => p.name === 'Bob');

      // Both players should have 2-week streak within Q3
      expect(alice.streak.count).toBe(2);
      expect(bob.streak.count).toBe(2);
    });
  });
});
