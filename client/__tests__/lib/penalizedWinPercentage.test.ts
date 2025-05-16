// Direct import that doesn't use the mock system
import { calculatePenalizedWinPercentage } from '../../src/lib/utils';

// Instead of mocking, let's just test the calculation directly
describe('Penalized Win Percentage', () => {
  test('calculates win percentage with penalty', () => {
    // Create a player with a full test data set
    const player = {
      matches: [{ date: new Date().toISOString() }],
      stats: {
        won: 10,
        lost: 5
      }
    };

    const result = calculatePenalizedWinPercentage(player);
    
    // Check the win rate calculation (10 wins out of 15 total games = 66.67%)
    expect(result.baseWinRate).toBeCloseTo(66.67, 2);
    
    // Since the player has a recent match, they should have no penalty
    expect(result.penaltyPercentage).toBe(0);
    expect(result.decayFactor).toBe(1);
    
    // Thus the penalizedWinRate should equal baseWinRate
    expect(result.penalizedWinRate).toBeCloseTo(result.baseWinRate, 2);
  });
  
  test('applies penalty to inactive players', () => {
    // Create a player with no recent activity (using a date far in the past)
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21); // 3 weeks ago
    
    const player = {
      matches: [{ date: threeWeeksAgo.toISOString() }],
      stats: {
        won: 10,
        lost: 10
      }
    };

    const result = calculatePenalizedWinPercentage(player);
    
    // Basic win rate should be 50%
    expect(result.baseWinRate).toBe(50);
    
    // Player is inactive for over 2 weeks, should have a penalty
    expect(result.penaltyPercentage).toBeGreaterThan(0);
    expect(result.decayFactor).toBeLessThan(1);
    
    // Penalized rate should be lower than base rate
    expect(result.penalizedWinRate).toBeLessThan(result.baseWinRate);
  });
});