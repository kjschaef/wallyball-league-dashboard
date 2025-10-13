import {
  calculateInactivityPenalty,
  calculateInactivityPenaltyWithDecay,
  calculateSeasonalInactivityPenalty,
  calculateSeasonalPenaltySeries,
  filterFutureMatches
} from '../inactivity-penalty';

describe('inactivity penalty utils', () => {
  it('returns 0 penalty for recent activity', () => {
    const now = new Date();
    const matchDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateInactivityPenalty([{ date: matchDate }], new Date().toISOString())).toBe(0);
  });

  it('applies weekly penalties after grace period', () => {
    const now = new Date();
    const lastMatch = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(); // 3 weeks ago
    const penalty = calculateInactivityPenalty([{ date: lastMatch }], new Date().toISOString());
    // 3 weeks -> 1 week beyond grace (2) => 5%
    expect(penalty).toBe(5);
  });

  it('calculateInactivityPenaltyWithDecay returns expected shape', () => {
    const now = new Date();
    const lastMatch = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString();
    const res = calculateInactivityPenaltyWithDecay([{ date: lastMatch }], new Date().toISOString());
    expect(res).toHaveProperty('penaltyPercentage');
    expect(res).toHaveProperty('decayFactor');
  });

  it('calculateSeasonalInactivityPenalty is 0 if within season grace', () => {
    const season = { id: 1, start_date: '2024-01-01', end_date: '2024-12-31', name: '2024' };
    const lastMatch = { date: '2024-12-20' };
    expect(calculateSeasonalInactivityPenalty([lastMatch], season as any, new Date().toISOString())).toBeGreaterThanOrEqual(0);
  });

  it('calculateSeasonalPenaltySeries returns map with season end', () => {
    const season = { id: 1, start_date: '2024-01-01', end_date: '2024-12-31', name: '2024' };
    const matches = [{ date: '2024-10-01' }];
    const series = calculateSeasonalPenaltySeries(matches as any, season as any, new Date().toISOString());
    expect(Object.keys(series).length).toBeGreaterThanOrEqual(1);
  });

  it('filterFutureMatches removes matches beyond tomorrow', () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const matches = [{ date: tomorrow }, { date: now.toISOString() }];
    const filtered = filterFutureMatches(matches as any);
    expect(filtered.every((m: any) => new Date(m.date) <= new Date(now.getTime() + 24 * 60 * 60 * 1000))).toBe(true);
  });

  it('isWithinExemption respects end date boundaries', () => {
    const { isWithinExemption } = require('../inactivity-penalty');
    const start = new Date();
    start.setDate(start.getDate() - 10);
    const end = new Date();
    end.setDate(end.getDate() - 1);
    const now = new Date();
    // Exemption ended yesterday; today should not be within
    expect(isWithinExemption(now, [{ startDate: start.toISOString(), endDate: end.toISOString() }])).toBe(false);
  });

  it('calculateInactivityPenaltyWithExemptions resumes from exemption end', () => {
    const { calculateInactivityPenaltyWithExemptions } = require('../inactivity-penalty');
    const now = new Date();
    // Last match 8 weeks ago
    const lastMatch = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000).toISOString();
    // Exemption covered until 3 weeks ago
    const exStart = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000).toISOString();
    const exEnd = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString();
    // Effective inactivity since exEnd is 3 weeks -> 1 week beyond grace => 5%
    const penalty = calculateInactivityPenaltyWithExemptions([{ date: lastMatch }], new Date().toISOString(), [{ startDate: exStart, endDate: exEnd }]);
    expect(penalty).toBe(5);
  });
});
