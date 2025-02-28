// Import the function to test
import { formatTeam } from '../utils';

// Group related tests
describe('Server Utilities', () => {
  describe('formatTeam function', () => {
    it('handles empty arrays', () => {
      expect(formatTeam([])).toBe('');
    });

    it('handles null values', () => {
      expect(formatTeam([1, null, 2])).toBe('1-2');
    });

    it('sorts player IDs for consistent team formatting', () => {
      expect(formatTeam([3, 1, 2])).toBe('1-2-3');
      expect(formatTeam([2, 3, 1])).toBe('1-2-3');
    });

    it('handles single player teams', () => {
      expect(formatTeam([42])).toBe('42');
    });

    it('removes duplicate IDs', () => {
      expect(formatTeam([1, 1, 2])).toBe('1-2');
    });

    it('handles all null values', () => {
      expect(formatTeam([null, null])).toBe('');
    });

    it('preserves original array', () => {
      const original = [3, 1, 2];
      formatTeam(original);
      expect(original).toEqual([3, 1, 2]);
    });
  });
});