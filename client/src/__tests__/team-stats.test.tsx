import { formatTeam, formatTeamFromIds } from '../utils/formatTeam';

describe('Team Formatting Utilities', () => {
  describe('formatTeam function', () => {
    it('returns a consistent team name regardless of player order', () => {
      const team1 = ['Alice', 'Bob'];
      const team2 = ['Bob', 'Alice'];
      
      // Verify both teams produce the same output
      expect(formatTeam(team1)).toBe(formatTeam(team2));
      // Verify alphabetical sorting
      expect(formatTeam(team2)).toBe('Alice and Bob');
    });
    
    it('handles teams with 1 player', () => {
      const player = ['Alice'];
      expect(formatTeam(player)).toBe('Alice');
    });
    
    it('handles teams with 2 players', () => {
      const team = ['Alice', 'Bob'];
      expect(formatTeam(team)).toBe('Alice and Bob');
    });
    
    it('handles teams with 3 players', () => {
      const team = ['Charlie', 'Alice', 'Bob'];
      expect(formatTeam(team)).toBe('Alice, Bob and Charlie');
    });
    
    it('handles empty teams', () => {
      expect(formatTeam([])).toBe('No players');
    });

    it('handles mixed data types correctly', () => {
      const team = ['Alice', 123, 'Bob'];
      expect(formatTeam(team)).toBe('123, Alice and Bob');
    });
    
    it('handles null values', () => {
      // The client implementation handles numeric player IDs differently
      expect(formatTeam([1, null, 2])).toBe('1-2');
    });

    it('handles numeric player IDs', () => {
      expect(formatTeam([3, 1, 2])).toBe('1-2-3');
    });
  });

  describe('formatTeamFromIds function', () => {
    // Define test players once for all tests
    const testPlayers = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' }
    ];
    
    it('handles null player IDs', () => {
      expect(formatTeamFromIds([1, null, 3], testPlayers)).toBe('Alice and Charlie');
    });
    
    it('creates consistent team names regardless of ID order', () => {
      const team1 = formatTeamFromIds([1, 2], testPlayers);
      const team2 = formatTeamFromIds([2, 1], testPlayers);
      
      expect(team1).toBe(team2);
      expect(team1).toBe('Alice and Bob');
    });
    
    it('handles empty arrays', () => {
      expect(formatTeamFromIds([], testPlayers)).toBe('No players');
    });
    
    it('handles non-existent player IDs', () => {
      expect(formatTeamFromIds([1, 999], testPlayers)).toBe('Alice');
    });
  });
});