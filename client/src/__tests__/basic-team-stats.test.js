/**
 * Basic tests for team name formatting utility
 */

import { formatTeam } from '../utils/formatTeam';

describe('Team Formatting Functionality', () => {
  test('formatTeam should return a consistent team name regardless of player order', () => {
    const team1 = ['Alice', 'Bob'];
    const team2 = ['Bob', 'Alice'];
    
    // The fixed function should return the same team name for both orders
    expect(formatTeam(team1)).toBe(formatTeam(team2));
  });
  
  test('formatTeam should handle teams with 1 player', () => {
    const player = ['Alice'];
    expect(formatTeam(player)).toBe('Alice');
  });

  test('formatTeam should handle teams with 2 players', () => {
    const team = ['Alice', 'Bob'];
    expect(formatTeam(team)).toBe('Alice and Bob');
  });

  test('formatTeam should handle teams with 3 players', () => {
    const team = ['Charlie', 'Alice', 'Bob'];
    // Note: After sorting, the players should be in alphabetical order
    expect(formatTeam(team)).toBe('Alice, Bob and Charlie');
  });

  test('formatTeam should handle empty teams', () => {
    expect(formatTeam([])).toBe('No players');
  });
});