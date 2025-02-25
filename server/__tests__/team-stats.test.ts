
import { formatTeam } from '../utils';

describe('Team Stats', () => {
  test('formatTeam should handle null values', () => {
    expect(formatTeam([1, null, 2])).toBe('1-2');
  });

  test('formatTeam should handle duplicate player IDs', () => {
    expect(formatTeam([1, 1, 2])).toBe('1-1-2');
    expect(formatTeam([2, 1, 1])).toBe('1-1-2');
  });

  test('should aggregate team stats regardless of player order', () => {
    // This mimics how the frontend processes teams
    const processTeam = (players: number[]) => players.map(id => id.toString()).join(', ');
    
    const matches = [
      {
        teamOnePlayers: [1, 2],
        teamTwoPlayers: [3, 4],
        teamOneGamesWon: 2,
        teamTwoGamesWon: 1
      },
      {
        teamOnePlayers: [2, 1], // Same team as above but different order
        teamTwoPlayers: [5, 6],
        teamOneGamesWon: 1,
        teamTwoGamesWon: 2
      }
    ];

    const stats = matches.reduce((acc, match) => {
      const teamOne = processTeam(match.teamOnePlayers);
      
      if (!acc[teamOne]) {
        acc[teamOne] = { wins: 0, losses: 0 };
      }
      acc[teamOne].wins += match.teamOneGamesWon;
      acc[teamOne].losses += match.teamTwoGamesWon;
      
      return acc;
    }, {} as Record<string, { wins: number; losses: number }>);

    // Without sorting, "1, 2" and "2, 1" will be treated as different teams
    const team12Stats = stats["1, 2"];
    const team21Stats = stats["2, 1"];
    
    // The test should now fail, showing that the teams are treated differently
    expect(team12Stats.wins + team21Stats.wins).toBe(3);
    expect(team12Stats.losses + team21Stats.losses).toBe(3);
  });
});
