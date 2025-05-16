import { calculatePenalizedWinPercentage } from '../../src/lib/utils';

// Create a mock for the entire module
jest.mock('../../src/lib/utils', () => {
  const originalModule = jest.requireActual('../../src/lib/utils');
  
  // Create a mock function that returns the expected penalty values
  const mockCalculateInactivityPenalty = jest.fn().mockReturnValue({
    penaltyPercentage: 0.1,
    decayFactor: 0.9
  });
  
  // Return a modified module with our mock function
  return {
    ...originalModule,
    calculateInactivityPenalty: mockCalculateInactivityPenalty
  };
});

// Import the mock function for assertions
const { calculateInactivityPenalty } = jest.requireMock('../../src/lib/utils');

describe('Penalized Win Percentage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('calculates win percentage with penalty', () => {
    const player = {
      stats: {
        won: 10,
        lost: 5
      }
    };

    const result = calculatePenalizedWinPercentage(player);
    
    // Check the win rate calculation
    expect(result.baseWinRate).toBeCloseTo(66.67, 2);
    
    // Verify that our mocked function was called with the player object
    expect(calculateInactivityPenalty).toHaveBeenCalledWith(player);
    
    // The decay factor from our mock (0.9) should be applied to the win rate
    expect(result.penalizedWinRate).toBeCloseTo(60.00, 2);
  });
});