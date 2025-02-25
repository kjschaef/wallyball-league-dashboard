
import { formatTeam } from "../utils";

describe('Team Stats Utils', () => {
  test('formatTeam should sort player IDs and join with dash', () => {
    expect(formatTeam([2, 1])).toBe('1-2');
    expect(formatTeam([1, 2])).toBe('1-2');
    expect(formatTeam([3, 1, 2])).toBe('1-2-3');
  });

  test('formatTeam should treat teams with same players as identical', () => {
    const team1 = formatTeam([2, 1]);
    const team2 = formatTeam([1, 2]);
    expect(team1).toBe(team2);
  });

  test('formatTeam should handle teams of different sizes consistently', () => {
    expect(formatTeam([3, 1, 2])).toBe('1-2-3');
    expect(formatTeam([2, 3, 1])).toBe('1-2-3');
    expect(formatTeam([1, 3, 2])).toBe('1-2-3');
  });

  test('formatTeam should handle duplicate player IDs', () => {
    expect(formatTeam([1, 1, 2])).toBe('1-1-2');
    expect(formatTeam([2, 1, 1])).toBe('1-1-2');
  });
});
