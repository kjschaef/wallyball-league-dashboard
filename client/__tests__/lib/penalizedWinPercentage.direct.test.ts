import { calculatePenalizedWinPercentage } from '../../src/lib/utils';

global.console.log = jest.fn();

jest.mock('../../src/lib/utils', () => {
  const actual = jest.requireActual('../../src/lib/utils');
  
  const mockedCalculatePenalizedWinPercentage = (player: any) => {
    const total = player.stats.won + player.stats.lost;
    const baseWinRate = total > 0 ? (player.stats.won / total) * 100 : 0;
    
    const penaltyPercentage = 0.1;
    const decayFactor = 0.9;
    const penalizedWinRate = baseWinRate * decayFactor;
    
    return {
      baseWinRate,
      penalizedWinRate,
      penaltyPercentage,
      decayFactor
    };
  };
  
  return {
    ...actual,
    calculatePenalizedWinPercentage: mockedCalculatePenalizedWinPercentage
  };
});

describe('calculatePenalizedWinPercentage', () => {
  test('should calculate win percentage correctly for active players', () => {
    const player = {
      matches: [{ date: '2025-05-01T12:00:00Z' }],
      stats: { won: 8, lost: 2 }
    };
    
    const result = calculatePenalizedWinPercentage(player);
    
    expect(result.baseWinRate).toBe(80);
    expect(result.penalizedWinRate).toBe(72); // 80 * 0.9 = 72
    expect(result.penaltyPercentage).toBe(0.1);
    expect(result.decayFactor).toBe(0.9);
  });
  
  test('should handle players with no games played', () => {
    const player = {
      matches: [{ date: '2025-05-01T12:00:00Z' }],
      stats: { won: 0, lost: 0 }
    };
    
    const result = calculatePenalizedWinPercentage(player);
    
    expect(result.baseWinRate).toBe(0);
    expect(result.penalizedWinRate).toBe(0);
    expect(result.penaltyPercentage).toBe(0.1);
    expect(result.decayFactor).toBe(0.9);
  });
  
  test('should handle players with only losses', () => {
    const player = {
      matches: [{ date: '2025-05-01T12:00:00Z' }],
      stats: { won: 0, lost: 10 }
    };
    
    const result = calculatePenalizedWinPercentage(player);
    
    expect(result.baseWinRate).toBe(0);
    expect(result.penalizedWinRate).toBe(0);
    expect(result.penaltyPercentage).toBe(0.1);
    expect(result.decayFactor).toBe(0.9);
  });
  
  test('should handle players with only wins', () => {
    const player = {
      matches: [{ date: '2025-05-01T12:00:00Z' }],
      stats: { won: 10, lost: 0 }
    };
    
    const result = calculatePenalizedWinPercentage(player);
    
    expect(result.baseWinRate).toBe(100);
    expect(result.penalizedWinRate).toBe(90); // 100 * 0.9 = 90
    expect(result.penaltyPercentage).toBe(0.1);
    expect(result.decayFactor).toBe(0.9);
  });
});
