/**
 * Basic tests for team name formatting utility
 */

const { formatTeam } = require('../utils/formatTeam');

describe('Team Formatting Functionality', () => {
  test('formatTeam should return a consistent team name regardless of player order', () => {
    const team1 = ['Alice', 'Bob'];
    const team2 = ['Bob', 'Alice'];
    
    // Both team orders should result in alphabetically sorted names
    expect(formatTeam(team1)).toBe('Alice and Bob');
    expect(formatTeam(team2)).toBe('Alice and Bob');
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

describe('Team Stats', () => {
  test('formatTeam should handle null values', () => {
    expect(formatTeam([1, null, 2])).toBe('1-2');
  });

  test('formatTeam should handle duplicate player IDs', () => {
    expect(formatTeam([1, 1, 2])).toBe('1-1-2');
    expect(formatTeam([2, 1, 1])).toBe('1-1-2');
  });
});