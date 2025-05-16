import { calculatePenalizedWinPercentage, calculateInactivityPenalty } from '../../src/lib/utils';

const mockCalculateInactivityPenalty = jest.fn();

jest.mock('../../src/lib/utils', () => {
  const actual = jest.requireActual('../../src/lib/utils');
  return {
    ...actual,
    calculateInactivityPenalty: () => mockCalculateInactivityPenalty()
  };
});

describe('Penalized Win Percentage', () => {
  beforeEach(() => {
    mockCalculateInactivityPenalty.mockClear();
  });

  test('calculates win percentage with penalty', () => {
    mockCalculateInactivityPenalty.mockReturnValue(0.1);

    const player = {
      stats: {
        won: 10,
        lost: 5
      }
    };

    const result = calculatePenalizedWinPercentage(player);
    expect(result.baseWinRate).toBeCloseTo(66.67, 2);
    expect(mockCalculateInactivityPenalty).toHaveBeenCalled();
  });
});