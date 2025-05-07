import { calculatePenalizedWinPercentage, calculateInactivityPenalty } from '../../src/lib/utils';

jest.mock('../../src/lib/utils', () => {
  const actual = jest.requireActual('../../src/lib/utils');
  return {
    ...actual,
    calculateInactivityPenalty: jest.fn()
  };
});

global.console.log = jest.fn();

describe('calculatePenalizedWinPercentage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (calculateInactivityPenalty as jest.Mock).mockReturnValue({
      lastMatch: new Date('2025-05-01'),
      weeksInactive: 2,
      penaltyPercentage: 0,
      decayFactor: 1
    });
  });
  
  test('should calculate win percentage correctly for active players', () => {
    const player = {
      matches: [{ date: '2025-05-01T12:00:00Z' }],
      stats: { won: 8, lost: 2 }
    };
    
    const result = calculatePenalizedWinPercentage(player);
    
    expect(result.baseWinRate).toBe(80);
    expect(result.penalizedWinRate).toBe(80);
    expect(result.penaltyPercentage).toBe(0);
    expect(result.decayFactor).toBe(1);
  });
  
  test('should handle players with no games played', () => {
    const player = {
      matches: [{ date: '2025-05-01T12:00:00Z' }],
      stats: { won: 0, lost: 0 }
    };
    
    const result = calculatePenalizedWinPercentage(player);
    
    expect(result.baseWinRate).toBe(0);
    expect(result.penalizedWinRate).toBe(0);
    expect(result.penaltyPercentage).toBe(0);
    expect(result.decayFactor).toBe(1);
  });
  
  test('should handle players with only losses', () => {
    const player = {
      matches: [{ date: '2025-05-01T12:00:00Z' }],
      stats: { won: 0, lost: 10 }
    };
    
    const result = calculatePenalizedWinPercentage(player);
    
    expect(result.baseWinRate).toBe(0);
    expect(result.penalizedWinRate).toBe(0);
    expect(result.penaltyPercentage).toBe(0);
    expect(result.decayFactor).toBe(1);
  });
  
  test('should handle players with only wins', () => {
    const player = {
      matches: [{ date: '2025-05-01T12:00:00Z' }],
      stats: { won: 10, lost: 0 }
    };
    
    const result = calculatePenalizedWinPercentage(player);
    
    expect(result.baseWinRate).toBe(100);
    expect(result.penalizedWinRate).toBe(100);
    expect(result.penaltyPercentage).toBe(0);
    expect(result.decayFactor).toBe(1);
  });
});
