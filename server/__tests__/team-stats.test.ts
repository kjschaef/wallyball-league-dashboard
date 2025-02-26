
import { formatTeam } from '../utils';

describe('Team Stats', () => {
  test('formatTeam should handle null values', () => {
    expect(formatTeam([1, null, 2])).toBe('1-2');
  });

  test('formatTeam should handle duplicate player IDs', () => {
    expect(formatTeam([1, 1, 2])).toBe('1-1-2');
    expect(formatTeam([2, 1, 1])).toBe('1-1-2');
  });

  test('should properly aggregate team stats regardless of player order', () => {
    // This uses our improved formatTeam function
    const processTeam = (players: number[]) => formatTeam(players);
    
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

    // Now with our fixed function, we should only have one team entry
    expect(stats["1-2"]).toBeDefined();
    expect(Object.keys(stats).length).toBe(1); // Should only have one team entry
    
    // The combined stats should add up correctly
    expect(stats["1-2"].wins).toBe(3); // 2 + 1
    expect(stats["1-2"].losses).toBe(3); // 1 + 2
  });
});
