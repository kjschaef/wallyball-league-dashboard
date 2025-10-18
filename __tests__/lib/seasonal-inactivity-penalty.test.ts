import { calculateSeasonalInactivityPenalty } from '../../lib/inactivity-penalty';

const mockSeason = {
  id: 1,
  name: '2024 Q1',
  start_date: '2024-01-01',
  end_date: '2024-03-31'
};

describe('calculateSeasonalInactivityPenalty', () => {
  describe('Basic functionality', () => {
    it('should return 0 for no matches', () => {
      const penalty = calculateSeasonalInactivityPenalty([], mockSeason, '2024-01-01');
      expect(penalty).toBe(0);
    });

    it('should still compute penalty when createdAt is null but matches exist', () => {
      const matches = [{ date: '2024-01-15' }];
      const penalty = calculateSeasonalInactivityPenalty(matches, mockSeason, null);
      expect(penalty).toBeGreaterThan(0);
    });

    it('should return 0 for no matches within season', () => {
      const matches = [{ date: '2023-12-15' }, { date: '2024-04-15' }]; // Outside season
      const penalty = calculateSeasonalInactivityPenalty(matches, mockSeason, '2024-01-01');
      expect(penalty).toBe(0);
    });
  });

  describe('3-day immediate reset rule', () => {
    it('should return 0% penalty for last match within 3 days of season end', () => {
      const matches = [{ date: '2024-03-29' }]; // 2 days before season end
      const penalty = calculateSeasonalInactivityPenalty(matches, mockSeason, '2024-01-01');
      expect(penalty).toBe(0);
    });

    it('should return 0% penalty for last match exactly 3 days before season end', () => {
      const matches = [{ date: '2024-03-28' }]; // Exactly 3 days before
      const penalty = calculateSeasonalInactivityPenalty(matches, mockSeason, '2024-01-01');
      expect(penalty).toBe(0);
    });

    it('should apply penalty for last match more than 3 days before season end', () => {
      const matches = [{ date: '2024-03-10' }]; // 21 days before season end (3 weeks)
      const penalty = calculateSeasonalInactivityPenalty(matches, mockSeason, '2024-01-01');
      expect(penalty).toBeGreaterThan(0);
    });
  });

  describe('2-week grace period', () => {
    it('should return 0% penalty for inactivity within 2 weeks of season end', () => {
      const matches = [{ date: '2024-03-17' }]; // 14 days = 2 weeks before season end
      const penalty = calculateSeasonalInactivityPenalty(matches, mockSeason, '2024-01-01');
      expect(penalty).toBe(0);
    });

    it('should return 0% penalty for inactivity exactly 2 weeks before season end', () => {
      const matches = [{ date: '2024-03-17' }]; // Exactly 14 days = 2 weeks
      const penalty = calculateSeasonalInactivityPenalty(matches, mockSeason, '2024-01-01');
      expect(penalty).toBe(0);
    });

    it('should apply 5% penalty for 3 weeks of inactivity', () => {
      const matches = [{ date: '2024-03-10' }]; // 21 days = 3 weeks before season end
      const penalty = calculateSeasonalInactivityPenalty(matches, mockSeason, '2024-01-01');
      expect(penalty).toBe(5);
    });
  });

  describe('Progressive penalty calculation', () => {
    it('should apply 5% penalty for 3 weeks of inactivity', () => {
      const matches = [{ date: '2024-03-10' }]; // 21 days = 3 weeks
      const penalty = calculateSeasonalInactivityPenalty(matches, mockSeason, '2024-01-01');
      expect(penalty).toBe(5);
    });

    it('should apply 10% penalty for 4 weeks of inactivity', () => {
      const matches = [{ date: '2024-03-03' }]; // 28 days = 4 weeks
      const penalty = calculateSeasonalInactivityPenalty(matches, mockSeason, '2024-01-01');
      expect(penalty).toBe(10);
    });

    it('should apply 25% penalty for 7 weeks of inactivity', () => {
      const matches = [{ date: '2024-02-11' }]; // 49 days = 7 weeks
      const penalty = calculateSeasonalInactivityPenalty(matches, mockSeason, '2024-01-01');
      expect(penalty).toBe(25);
    });

    it('should cap penalty at 50% for extended inactivity', () => {
      const matches = [{ date: '2024-01-01' }]; // Start of season = ~90 days = ~13 weeks
      const penalty = calculateSeasonalInactivityPenalty(matches, mockSeason, '2024-01-01');
      expect(penalty).toBe(50);
    });

    it('should cap penalty at 50% for extreme inactivity', () => {
      const matches = [{ date: '2024-01-01' }]; // 90 days inactive = 13 weeks = 55% uncapped
      const penalty = calculateSeasonalInactivityPenalty(matches, mockSeason, '2024-01-01');
      expect(penalty).toBe(50); // Should be capped at 50%
    });
  });

  describe('Match sorting and filtering', () => {
    it('should use the last match chronologically within the season', () => {
      const matches = [
        { date: '2024-01-15' },
        { date: '2024-02-20' }, // This should be the last match used
        { date: '2024-01-30' },
        { date: '2024-04-15' }  // Outside season - should be ignored
      ];
      
      // Last match in season is 2024-02-20, which is 40 days before season end
      // 40 days = ~5.7 weeks, so penalty weeks = 5.7 - 2 = 3.7 weeks = 3 penalty weeks = 15%
      const penalty = calculateSeasonalInactivityPenalty(matches, mockSeason, '2024-01-01');
      expect(penalty).toBe(15);
    });

    it('should filter out future-dated matches', () => {
      // Test with future date that would be within season if not filtered
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 days in future
      
      const futureSeason = {
        id: 1,
        name: 'Future Season',
        start_date: futureDate.toISOString().split('T')[0],
        end_date: new Date(futureDate.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      
      const matches = [
        { date: new Date(futureDate.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] } // Future match
      ];
      
      const penalty = calculateSeasonalInactivityPenalty(matches, futureSeason, futureDate.toISOString());
      expect(penalty).toBe(0); // Should be 0 because future match is filtered out
    });
  });

  describe('Edge cases', () => {
    it('should handle matches on season boundary dates', () => {
      const matches = [
        { date: '2024-01-01' }, // Season start
        { date: '2024-03-31' }  // Season end
      ];
      const penalty = calculateSeasonalInactivityPenalty(matches, mockSeason, '2024-01-01');
      expect(penalty).toBe(0); // Last match on season end = 0 days = immediate reset
    });

    it('should handle single match in season', () => {
      const matches = [{ date: '2024-02-15' }]; // Mid-season match
      // From 2024-02-15 to 2024-03-31 = 45 days = ~6.4 weeks
      // Penalty weeks = 6.4 - 2 = 4.4 weeks = 4 penalty weeks = 20%
      const penalty = calculateSeasonalInactivityPenalty(matches, mockSeason, '2024-01-01');
      expect(penalty).toBe(20);
    });

    it('should handle very short seasons', () => {
      const shortSeason = {
        id: 1,
        name: 'Short Season',
        start_date: '2024-01-01',
        end_date: '2024-01-14' // Only 2 weeks long
      };
      
      const matches = [{ date: '2024-01-01' }]; // Match at start of short season
      // 13 days = ~1.9 weeks, penalty weeks = 0 (within grace period)
      const penalty = calculateSeasonalInactivityPenalty(matches, shortSeason, '2024-01-01');
      expect(penalty).toBe(0);
    });
  });

  describe('Debug logging', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    afterEach(() => {
      consoleSpy.mockClear();
    });

    afterAll(() => {
      consoleSpy.mockRestore();
    });

    it('should log debug information for players with penalties', () => {
      const matches = [{ date: '2024-03-03' }]; // 4 weeks before season end = 10% penalty
      calculateSeasonalInactivityPenalty(matches, mockSeason, '2024-01-01', 'TestPlayer');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Seasonal penalty for TestPlayer in 2024 Q1: 10%')
      );
    });

    it('should not log debug information for players without penalties', () => {
      const matches = [{ date: '2024-03-30' }]; // Within 3-day reset window
      calculateSeasonalInactivityPenalty(matches, mockSeason, '2024-01-01', 'TestPlayer');
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});
