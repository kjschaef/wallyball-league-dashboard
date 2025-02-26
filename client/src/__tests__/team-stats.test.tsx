/**
 * Basic tests for team name formatting functionality
 */

import { formatTeam } from '../utils/formatTeam';

test('formatTeam should return a consistent team name regardless of player order', () => {
  const team1 = ['Alice', 'Bob'];
  const team2 = ['Bob', 'Alice'];
  
  // The fixed function should return the same team name for both orders
  expect(formatTeam(team1)).toBe(formatTeam(team2));
});