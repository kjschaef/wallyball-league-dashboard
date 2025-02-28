import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { formatTeam } from '../utils';

describe('Team Statistics', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('formatTeam sorts player IDs consistently', () => {
    expect(formatTeam([3, 1, 2])).toBe('1-2-3');
    expect(formatTeam([1, 2, 3])).toBe('1-2-3');
    expect(formatTeam([2, 3, 1])).toBe('1-2-3');
  });

  test('formatTeam handles null values correctly', () => {
    expect(formatTeam([1, null, 2])).toBe('1-2');
    expect(formatTeam([null, 1, null, 2, null])).toBe('1-2');
  });

  test('formatTeam creates consistent team identifiers across multiple calls', () => {
    const team1 = formatTeam([1, 2]);
    const team2 = formatTeam([2, 1]);
    expect(team1).toBe(team2);
  });

  test('formatTeam handles empty arrays', () => {
    expect(formatTeam([])).toBe('');
  });

  test('formatTeam removes duplicate IDs', () => {
    expect(formatTeam([1, 1, 2])).toBe('1-2');
  });

  test('formatTeam preserves original array', () => {
    const original = [3, 1, 2];
    formatTeam(original);
    expect(original).toEqual([3, 1, 2]);
  });
});