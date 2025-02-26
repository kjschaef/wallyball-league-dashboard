/**
 * Basic tests for team name formatting functionality
 */

import { formatTeam } from '../utils/formatTeam';

test('formatTeam should return a consistent team name regardless of player order', () => {
  const team1 = ['Alice', 'Bob'];
  const team2 = ['Bob', 'Alice'];
  
  // Ensure both teams are formatted consistently 
  expect(formatTeam(team1)).toBe(formatTeam(team2));
  // Verify the order is alphabetical
  expect(formatTeam(team1)).toBe('Alice and Bob');
});