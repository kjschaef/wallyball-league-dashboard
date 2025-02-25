
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
      const teamOne = formatTeam(match.teamOnePlayers);
      
      if (!acc[teamOne]) {
        acc[teamOne] = { wins: 0, losses: 0 };
      }
      acc[teamOne].wins += match.teamOneGamesWon;
      acc[teamOne].losses += match.teamTwoGamesWon;
      
      return acc;
    }, {} as Record<string, { wins: number; losses: number }>);

    // Team [1,2] should have 3 wins and 3 losses total, combining both matches
    const team12Stats = stats[formatTeam([1, 2])];
    expect(team12Stats.wins).toBe(3);
    expect(team12Stats.losses).toBe(3);
  });
});
