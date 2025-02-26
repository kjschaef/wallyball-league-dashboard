/**
 * Basic tests for team name formatting functionality
 */

import { formatTeam } from '../utils/formatTeam';

test('formatTeam should return a consistent team name regardless of player order', () => {
  const team1 = ['Alice', 'Bob'];
  const team2 = ['Bob', 'Alice'];
  
  // Both team orders should result in alphabetically sorted names
  expect(formatTeam(team1)).toBe('Alice and Bob');
  expect(formatTeam(team2)).toBe('Alice and Bob');
});