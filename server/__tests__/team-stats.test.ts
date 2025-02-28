import { formatTeam } from '../utils';

describe('Team Statistics Utilities', () => {
  describe('formatTeam function', () => {
    it('sorts player IDs consistently', () => {
      expect(formatTeam([3, 1, 2])).toBe('1-2-3');
      expect(formatTeam([1, 2, 3])).toBe('1-2-3');
      expect(formatTeam([2, 3, 1])).toBe('1-2-3');
    });

    it('handles null values correctly', () => {
      expect(formatTeam([1, null, 2])).toBe('1-2');
      expect(formatTeam([null, 1, null, 2, null])).toBe('1-2');
    });

    it('creates consistent team identifiers across multiple calls', () => {
      const team1 = formatTeam([1, 2]);
      const team2 = formatTeam([2, 1]);
      expect(team1).toBe(team2);
    });

    it('handles empty arrays', () => {
      expect(formatTeam([])).toBe('');
    });

    it('removes duplicate IDs', () => {
      expect(formatTeam([1, 1, 2])).toBe('1-2');
    });

    it('preserves original array', () => {
      const original = [3, 1, 2];
      formatTeam(original);
      expect(original).toEqual([3, 1, 2]);
    });
  });
});