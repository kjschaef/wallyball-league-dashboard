import { NextRequest } from 'next/server';
import { GET } from '@/app/api/player-stats/route';

// Mock the neon database connection
const mockSql = jest.fn();

// Create a mock function that handles template literals properly
const createMockSql = () => {
  return Object.assign(
    jest.fn().mockImplementation((strings: TemplateStringsArray, ...values: any[]) => {
      const query = strings.join('');
      if (query.includes('SELECT * FROM players')) {
        return mockSql('players');
      } else if (query.includes('SELECT * FROM matches')) {
        return mockSql('matches');
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



// Mock Next.js environment
process.env.DATABASE_URL = 'mock-database-url';

describe('/api/player-stats - Activity Streak Calculation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Activity streak calculation', () => {
    it('should calculate activity streaks based on consecutive weeks', async () => {
      const mockPlayers = [
        { id: 1, name: 'Alice', start_year: 2020, created_at: '2020-01-01' },
        { id: 2, name: 'Bob', start_year: 2020, created_at: '2020-01-01' },
      ];

      // Create matches across consecutive weeks (Monday to Monday)
      const mockMatches = [
        // Week 1 (Monday Jan 1, 2024)
        {
          id: 1,
          team_one_player_one_id: 1, // Alice
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: 2, // Bob
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 3,
          team_two_games_won: 1,
          date: '2024-01-01T10:00:00.000Z' // Monday
        },
        // Week 2 (Monday Jan 8, 2024)
        {
          id: 2,
          team_one_player_one_id: 1, // Alice
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: 2, // Bob
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 2,
          team_two_games_won: 2,
          date: '2024-01-08T10:00:00.000Z' // Monday
        },
        // Week 3 (Monday Jan 15, 2024)
        {
          id: 3,
          team_one_player_one_id: 1, // Alice
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: 2, // Bob
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 1,
          team_two_games_won: 4,
          date: '2024-01-15T10:00:00.000Z' // Monday
        }
      ];

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'players') {
          return Promise.resolve(mockPlayers);
        }
        if (queryType === 'matches') {
          return Promise.resolve(mockMatches);
        }
        return Promise.resolve([]);
      });

      const request = new NextRequest('http://localhost:3000/api/player-stats');
      const response = await GET(request);
      const playerStats = await response.json();

      const alice = playerStats.find((p: any) => p.name === 'Alice');
      const bob = playerStats.find((p: any) => p.name === 'Bob');

      // Both players played for 3 consecutive weeks
      expect(alice.streak).toEqual({
        type: 'activity',
        count: 3
      });

      expect(bob.streak).toEqual({
        type: 'activity',
        count: 3
      });
    });

    it('should reset streak when there is a gap in activity', async () => {
      const mockPlayers = [
        { id: 1, name: 'Alice', start_year: 2020, created_at: '2020-01-01' },
        { id: 2, name: 'Bob', start_year: 2020, created_at: '2020-01-01' },
      ];

      const mockMatches = [
        // Week 1 (Monday Jan 1, 2024)
        {
          id: 1,
          team_one_player_one_id: 1, // Alice
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: 2, // Bob
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 3,
          team_two_games_won: 1,
          date: '2024-01-01T10:00:00.000Z'
        },
        // Week 2 (Monday Jan 8, 2024) - Alice plays, Bob doesn't
        {
          id: 2,
          team_one_player_one_id: 1, // Alice only
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: null,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 2,
          team_two_games_won: 1,
          date: '2024-01-08T10:00:00.000Z'
        },
        // Week 4 (Monday Jan 22, 2024) - Bob returns after gap
        {
          id: 3,
          team_one_player_one_id: 2, // Bob
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: null,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 3,
          team_two_games_won: 2,
          date: '2024-01-22T10:00:00.000Z'
        }
      ];

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'players') {
          return Promise.resolve(mockPlayers);
        }
        if (queryType === 'matches') {
          return Promise.resolve(mockMatches);
        }
        return Promise.resolve([]);
      });

      const request = new NextRequest('http://localhost:3000/api/player-stats');
      const response = await GET(request);
      const playerStats = await response.json();

      const alice = playerStats.find((p: any) => p.name === 'Alice');
      const bob = playerStats.find((p: any) => p.name === 'Bob');

      // Alice played weeks 1 and 2 consecutively (streak = 2)
      expect(alice.streak).toEqual({
        type: 'activity',
        count: 2
      });

      // Bob played week 1, skipped weeks 2-3, then played week 4 (streak = 1)
      expect(bob.streak).toEqual({
        type: 'activity',
        count: 1
      });
    });

    it('should handle multiple matches within the same week', async () => {
      const mockPlayers = [
        { id: 1, name: 'Alice', start_year: 2020, created_at: '2020-01-01' },
      ];

      const mockMatches = [
        // Week 1 - Monday
        {
          id: 1,
          team_one_player_one_id: 1, // Alice
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: null,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 3,
          team_two_games_won: 1,
          date: '2024-01-01T10:00:00.000Z'
        },
        // Week 1 - Wednesday (same week)
        {
          id: 2,
          team_one_player_one_id: 1, // Alice
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: null,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 2,
          team_two_games_won: 2,
          date: '2024-01-03T15:00:00.000Z'
        },
        // Week 1 - Sunday (still same week)
        {
          id: 3,
          team_one_player_one_id: 1, // Alice
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: null,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 1,
          team_two_games_won: 3,
          date: '2024-01-07T18:00:00.000Z'
        },
        // Week 2 - Monday
        {
          id: 4,
          team_one_player_one_id: 1, // Alice
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: null,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 4,
          team_two_games_won: 1,
          date: '2024-01-08T10:00:00.000Z'
        }
      ];

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'players') {
          return Promise.resolve(mockPlayers);
        }
        if (queryType === 'matches') {
          return Promise.resolve(mockMatches);
        }
        return Promise.resolve([]);
      });

      const request = new NextRequest('http://localhost:3000/api/player-stats');
      const response = await GET(request);
      const playerStats = await response.json();

      const alice = playerStats.find((p: any) => p.name === 'Alice');

      // Alice played in 2 consecutive weeks (multiple matches in week 1 count as 1 week)
      expect(alice.streak).toEqual({
        type: 'activity',
        count: 2
      });
    });

    it('should track activity streaks regardless of win/loss outcome', async () => {
      const mockPlayers = [
        { id: 1, name: 'Alice', start_year: 2020, created_at: '2020-01-01' },
      ];

      const mockMatches = [
        // Week 1 - Alice wins
        {
          id: 1,
          team_one_player_one_id: 1, // Alice
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: null,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 3,
          team_two_games_won: 1,
          date: '2024-01-01T10:00:00.000Z'
        },
        // Week 2 - Alice loses
        {
          id: 2,
          team_one_player_one_id: 1, // Alice
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: null,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 1,
          team_two_games_won: 4,
          date: '2024-01-08T10:00:00.000Z'
        },
        // Week 3 - Alice loses again
        {
          id: 3,
          team_one_player_one_id: 1, // Alice
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: null,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 0,
          team_two_games_won: 3,
          date: '2024-01-15T10:00:00.000Z'
        }
      ];

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'players') {
          return Promise.resolve(mockPlayers);
        }
        if (queryType === 'matches') {
          return Promise.resolve(mockMatches);
        }
        return Promise.resolve([]);
      });

      const request = new NextRequest('http://localhost:3000/api/player-stats');
      const response = await GET(request);
      const playerStats = await response.json();

      const alice = playerStats.find((p: any) => p.name === 'Alice');

      // Alice has 3-week activity streak despite losing in weeks 2 and 3
      expect(alice.streak).toEqual({
        type: 'activity',
        count: 3
      });

      // Verify her win/loss record shows the actual outcomes
      expect(alice.record.wins).toBe(4); // 3 + 1 + 0
      expect(alice.record.losses).toBe(8); // 1 + 4 + 3
    });

    it('should return zero streak for players with no matches', async () => {
      const mockPlayers = [
        { id: 1, name: 'Alice', start_year: 2020, created_at: '2020-01-01' },
      ];

      const mockMatches: any[] = []; // No matches

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'players') {
          return Promise.resolve(mockPlayers);
        }
        if (queryType === 'matches') {
          return Promise.resolve(mockMatches);
        }
        return Promise.resolve([]);
      });

      const request = new NextRequest('http://localhost:3000/api/player-stats');
      const response = await GET(request);
      const playerStats = await response.json();

      const alice = playerStats.find((p: any) => p.name === 'Alice');

      expect(alice.streak).toEqual({
        type: 'activity',
        count: 0
      });
    });

    it('should calculate longest historical streak, not current ongoing streak', async () => {
      const mockPlayers = [
        { id: 1, name: 'Alice', start_year: 2020, created_at: '2020-01-01' },
      ];

      const mockMatches = [
        // Weeks 1-4: Long streak
        {
          id: 1,
          team_one_player_one_id: 1, // Alice
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: null,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 3,
          team_two_games_won: 1,
          date: '2024-01-01T10:00:00.000Z' // Week 1
        },
        {
          id: 2,
          team_one_player_one_id: 1, // Alice
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: null,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 2,
          team_two_games_won: 2,
          date: '2024-01-08T10:00:00.000Z' // Week 2
        },
        {
          id: 3,
          team_one_player_one_id: 1, // Alice
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: null,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 1,
          team_two_games_won: 3,
          date: '2024-01-15T10:00:00.000Z' // Week 3
        },
        {
          id: 4,
          team_one_player_one_id: 1, // Alice
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: null,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 4,
          team_two_games_won: 0,
          date: '2024-01-22T10:00:00.000Z' // Week 4
        },
        // Gap - Week 5 no activity
        // Weeks 6-7: Shorter recent streak
        {
          id: 5,
          team_one_player_one_id: 1, // Alice
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: null,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 2,
          team_two_games_won: 1,
          date: '2024-02-05T10:00:00.000Z' // Week 6
        },
        {
          id: 6,
          team_one_player_one_id: 1, // Alice
          team_one_player_two_id: null,
          team_one_player_three_id: null,
          team_two_player_one_id: null,
          team_two_player_two_id: null,
          team_two_player_three_id: null,
          team_one_games_won: 1,
          team_two_games_won: 2,
          date: '2024-02-12T10:00:00.000Z' // Week 7
        }
      ];

      mockSql.mockImplementation((queryType) => {
        if (queryType === 'players') {
          return Promise.resolve(mockPlayers);
        }
        if (queryType === 'matches') {
          return Promise.resolve(mockMatches);
        }
        return Promise.resolve([]);
      });

      const request = new NextRequest('http://localhost:3000/api/player-stats');
      const response = await GET(request);
      const playerStats = await response.json();

      const alice = playerStats.find((p: any) => p.name === 'Alice');

      // Should return the longest streak (4 weeks), not the recent streak (2 weeks)
      expect(alice.streak).toEqual({
        type: 'activity',
        count: 4
      });
    });
  });
});
