
import { formatTeam, formatTeamFromIds } from '../utils/formatTeam';

describe('Team Formatting Functionality', () => {
  test('formatTeam should return a consistent team name regardless of player order', () => {
    const team1 = ['Alice', 'Bob'];
    const team2 = ['Bob', 'Alice'];
    
    // Verify both teams produce the same output
    expect(formatTeam(team1)).toBe(formatTeam(team2));
    // Verify alphabetical sorting
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
    expect(formatTeam(team)).toBe('Alice, Bob and Charlie');
  });
  
  test('formatTeam should handle empty teams', () => {
    expect(formatTeam([])).toBe('No players');
  });

  test('formatTeam should handle mixed data types correctly', () => {
    const team = ['Alice', 123, 'Bob'];
    expect(formatTeam(team)).toBe('123, Alice and Bob');
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
  
  test('formatTeamFromIds handles null player IDs', () => {
    const players = [
      { id: 1, name: 'Alice', createdAt: '2023-01-01' },
      { id: 2, name: 'Bob', createdAt: '2023-01-02' },
      { id: 3, name: 'Charlie', createdAt: '2023-01-03' }
    ];
    
    expect(formatTeamFromIds([1, null, 3], players)).toBe('Alice and Charlie');
  });
  
  test('formatTeamFromIds creates consistent team names regardless of ID order', () => {
    const players = [
      { id: 1, name: 'Alice', createdAt: '2023-01-01' },
      { id: 2, name: 'Bob', createdAt: '2023-01-02' }
    ];
    
    const team1 = formatTeamFromIds([1, 2], players);
    const team2 = formatTeamFromIds([2, 1], players);
    
    expect(team1).toBe(team2);
    expect(team1).toBe('Alice and Bob');
  });
  
  test('formatTeamFromIds handles empty arrays', () => {
    const players = [
      { id: 1, name: 'Alice', createdAt: '2023-01-01' },
      { id: 2, name: 'Bob', createdAt: '2023-01-02' }
    ];
    
    expect(formatTeamFromIds([], players)).toBe('No players');
  });
  
  test('formatTeamFromIds handles non-existent player IDs', () => {
    const players = [
      { id: 1, name: 'Alice', createdAt: '2023-01-01' },
      { id: 2, name: 'Bob', createdAt: '2023-01-02' }
    ];
    
    expect(formatTeamFromIds([1, 999], players)).toBe('Alice');
  });
});
