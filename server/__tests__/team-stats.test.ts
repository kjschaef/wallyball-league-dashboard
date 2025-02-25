
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
});
