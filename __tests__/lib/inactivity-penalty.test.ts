/**
 * Unit tests for inactivity penalty calculation utility functions
 */

import { calculateInactivityPenalty, filterFutureMatches, Match } from '../../lib/inactivity-penalty';

describe('Inactivity Penalty Calculation', () => {
  const baseDate = new Date('2025-08-19T12:00:00.000Z');
  
  beforeEach(() => {
    // Mock the current date to ensure consistent test results
    jest.useFakeTimers();
    jest.setSystemTime(baseDate);
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  // Helper function to create relative dates
  const daysAgo = (days: number): string => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };
  
  const weeksAgo = (weeks: number): string => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - (weeks * 7));
    return date.toISOString();
  };
  
  describe('calculateInactivityPenalty', () => {
    const playerCreatedAt = '2024-01-01T00:00:00.000Z';
    
    describe('Immediate Penalty Reset (within 3 days)', () => {
      it('should return 0% penalty when player played today', () => {
        const matches: Match[] = [
          { date: daysAgo(0) } // Today
        ];
        
        const penalty = calculateInactivityPenalty(matches, playerCreatedAt);
        
        expect(penalty).toBe(0);
      });
      
      it('should return 0% penalty when player played 1 day ago', () => {
        const matches: Match[] = [
          { date: daysAgo(1) } // 1 day ago
        ];
        
        const penalty = calculateInactivityPenalty(matches, playerCreatedAt);
        
        expect(penalty).toBe(0);
      });
      
      it('should return 0% penalty when player played 3 days ago (boundary)', () => {
        const matches: Match[] = [
          { date: daysAgo(3) } // 3 days ago
        ];
        
        const penalty = calculateInactivityPenalty(matches, playerCreatedAt);
        
        expect(penalty).toBe(0);
      });
      
      it('should return 0% penalty when player played 4 days ago (boundary of immediate reset)', () => {
        const matches: Match[] = [
          { date: daysAgo(4) } // 4 days ago - just outside 3-day window
        ];
        
        const penalty = calculateInactivityPenalty(matches, playerCreatedAt);
        
        expect(penalty).toBe(0); // Should still be 0% due to grace period, not immediate reset
      });
      
      it('should use most recent match when multiple matches exist', () => {
        const matches: Match[] = [
          { date: daysAgo(0) }, // Most recent (today)
          { date: weeksAgo(7) }, // 7 weeks ago
          { date: daysAgo(4) }  // 4 days ago
        ];
        
        const penalty = calculateInactivityPenalty(matches, playerCreatedAt);
        
        expect(penalty).toBe(0); // Should use most recent match (today)
      });
    });
    
    describe('Grace Period (2 weeks)', () => {
      it('should return 0% penalty when player played 5 days ago (just outside immediate reset)', () => {
        const matches: Match[] = [
          { date: daysAgo(5) } // 5 days ago
        ];
        
        const penalty = calculateInactivityPenalty(matches, playerCreatedAt);
        
        expect(penalty).toBe(0); // Still within 2-week grace period
      });
      
      it('should return 0% penalty when player played 1 week ago', () => {
        const matches: Match[] = [
          { date: weeksAgo(1) } // 1 week ago
        ];
        
        const penalty = calculateInactivityPenalty(matches, playerCreatedAt);
        
        expect(penalty).toBe(0);
      });
      
      it('should return 0% penalty when player played exactly 2 weeks ago (boundary)', () => {
        const matches: Match[] = [
          { date: weeksAgo(2) } // Exactly 2 weeks ago
        ];
        
        const penalty = calculateInactivityPenalty(matches, playerCreatedAt);
        
        expect(penalty).toBe(0);
      });
      
      it('should return 0% penalty when player played 13 days ago', () => {
        const matches: Match[] = [
          { date: daysAgo(13) } // 13 days ago
        ];
        
        const penalty = calculateInactivityPenalty(matches, playerCreatedAt);
        
        expect(penalty).toBe(0);
      });
    });
    
    describe('Progressive Penalty (after 2 weeks)', () => {
      it('should return 5% penalty when player played 3 weeks ago', () => {
        const matches: Match[] = [
          { date: weeksAgo(3) } // 3 weeks ago
        ];
        
        const penalty = calculateInactivityPenalty(matches, playerCreatedAt);
        
        expect(penalty).toBe(5); // 1 week over grace period = 5%
      });
      
      it('should return 10% penalty when player played 4 weeks ago', () => {
        const matches: Match[] = [
          { date: weeksAgo(4) } // 4 weeks ago
        ];
        
        const penalty = calculateInactivityPenalty(matches, playerCreatedAt);
        
        expect(penalty).toBe(10); // 2 weeks over grace period = 10%
      });
      
      it('should return 25% penalty when player played 7 weeks ago', () => {
        const matches: Match[] = [
          { date: weeksAgo(7) } // 7 weeks ago
        ];
        
        const penalty = calculateInactivityPenalty(matches, playerCreatedAt);
        
        expect(penalty).toBe(25); // 5 weeks over grace period = 25%
      });
      
      it('should cap penalty at 50% when player played 12 weeks ago', () => {
        const matches: Match[] = [
          { date: weeksAgo(12) } // 12 weeks ago
        ];
        
        const penalty = calculateInactivityPenalty(matches, playerCreatedAt);
        
        expect(penalty).toBe(50); // 10 weeks over grace period = 50% (capped)
      });
      
      it('should cap penalty at 50% for extremely long inactivity', () => {
        const matches: Match[] = [
          { date: weeksAgo(26) } // 6 months ago (26 weeks)
        ];
        
        const penalty = calculateInactivityPenalty(matches, playerCreatedAt);
        
        expect(penalty).toBe(50); // Capped at 50%
      });
      
      it('should calculate penalty correctly for edge case (3 weeks exactly)', () => {
        const matches: Match[] = [
          { date: weeksAgo(3) } // Exactly 3 weeks ago
        ];
        
        const penalty = calculateInactivityPenalty(matches, playerCreatedAt);
        
        expect(penalty).toBe(5); // 1 week over grace period = 5%
      });
    });
    
    describe('Edge Cases', () => {
      it('should return 0% penalty when player has no matches', () => {
        const matches: Match[] = [];
        
        const penalty = calculateInactivityPenalty(matches, playerCreatedAt);
        
        expect(penalty).toBe(0);
      });
      
      it('should return 0% penalty when createdAt is null', () => {
        const matches: Match[] = [
          { date: '2025-07-01T12:00:00.000Z' }
        ];
        
        const penalty = calculateInactivityPenalty(matches, null);
        
        expect(penalty).toBe(0);
      });
      
      it('should return 0% penalty when both matches are empty and createdAt is null', () => {
        const matches: Match[] = [];
        
        const penalty = calculateInactivityPenalty(matches, null);
        
        expect(penalty).toBe(0);
      });
      
      it('should handle invalid date strings gracefully', () => {
        const matches: Match[] = [
          { date: 'invalid-date' }
        ];
        
        // Should not throw error and should handle gracefully
        expect(() => {
          const penalty = calculateInactivityPenalty(matches, playerCreatedAt);
          expect(typeof penalty).toBe('number');
        }).not.toThrow();
      });
      
      it('should use createdAt as fallback when no matches exist but createdAt is provided', () => {
        const recentCreatedAt = daysAgo(1); // 1 day ago
        const matches: Match[] = [];
        
        const penalty = calculateInactivityPenalty(matches, recentCreatedAt);
        
        expect(penalty).toBe(0); // Should use createdAt as last activity
      });
    });
  });
  
  describe('filterFutureMatches', () => {
    // Helper functions for future dates
    const hoursInFuture = (hours: number): string => {
      const date = new Date(baseDate);
      date.setHours(date.getHours() + hours);
      return date.toISOString();
    };
    
    const daysInFuture = (days: number): string => {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + days);
      return date.toISOString();
    };
    
    it('should include matches from today', () => {
      const matches: Match[] = [
        { date: daysAgo(0) } // Today
      ];
      
      const filtered = filterFutureMatches(matches);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toEqual(matches[0]);
    });
    
    it('should include matches from the past', () => {
      const matches: Match[] = [
        { date: daysAgo(1) }, // 1 day ago
        { date: weeksAgo(7) }  // 7 weeks ago
      ];
      
      const filtered = filterFutureMatches(matches);
      
      expect(filtered).toHaveLength(2);
      expect(filtered).toEqual(matches);
    });
    
    it('should include matches within 24 hours in the future (timezone buffer)', () => {
      const matches: Match[] = [
        { date: hoursInFuture(18) } // 18 hours in future
      ];
      
      const filtered = filterFutureMatches(matches);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toEqual(matches[0]);
    });
    
    it('should exclude matches more than 24 hours in the future', () => {
      const todayMatch = { date: daysAgo(0) }; // Today
      const matches: Match[] = [
        { date: daysInFuture(2) }, // More than 24h in future
        todayMatch  // Today (should be included)
      ];
      
      const filtered = filterFutureMatches(matches);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toEqual(todayMatch);
    });
    
    it('should handle empty matches array', () => {
      const matches: Match[] = [];
      
      const filtered = filterFutureMatches(matches);
      
      expect(filtered).toHaveLength(0);
    });
    
    it('should handle boundary case (exactly 24 hours in future)', () => {
      const matches: Match[] = [
        { date: hoursInFuture(24) } // Exactly 24 hours in future
      ];
      
      const filtered = filterFutureMatches(matches);
      
      expect(filtered).toHaveLength(1); // Should be included (boundary inclusive)
    });
  });
});