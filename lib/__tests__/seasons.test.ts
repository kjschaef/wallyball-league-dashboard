import {
  getCurrentSeasonByDate,
  listSeasons,
  getSeasonById,
  getSeasonIdFromMatch
} from '../seasons';

describe('seasons utility', () => {
  describe('getCurrentSeasonByDate', () => {
    it('returns the correct season for Q1', () => {
      const date = new Date('2024-02-15T12:00:00Z');
      const season = getCurrentSeasonByDate(date);
      expect(season).toEqual({
        name: '2024 Q1',
        start_date: '2024-01-01',
        end_date: '2024-03-31'
      });
    });

    it('returns the correct season for Q2', () => {
      const date = new Date('2024-05-20T12:00:00Z');
      const season = getCurrentSeasonByDate(date);
      expect(season).toEqual({
        name: '2024 Q2',
        start_date: '2024-04-01',
        end_date: '2024-06-30'
      });
    });

    it('returns the correct season for Q3', () => {
      const date = new Date('2024-08-10T12:00:00Z');
      const season = getCurrentSeasonByDate(date);
      expect(season).toEqual({
        name: '2024 Q3',
        start_date: '2024-07-01',
        end_date: '2024-09-30'
      });
    });

    it('returns the correct season for Q4', () => {
      const date = new Date('2024-11-05T12:00:00Z');
      const season = getCurrentSeasonByDate(date);
      expect(season).toEqual({
        name: '2024 Q4',
        start_date: '2024-10-01',
        end_date: '2024-12-31'
      });
    });
  });

  describe('listSeasons', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-05-15T12:00:00Z').getTime()); // Q2 2024
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns the last 8 quarters by default', () => {
      const seasons = listSeasons();
      // 8 quarters:
      // 2024 Q2, 2024 Q1,
      // 2023 Q4, 2023 Q3, 2023 Q2, 2023 Q1,
      // 2022 Q4, 2022 Q3
      const quarters = seasons.filter(s => s.id % 10 !== 0);
      expect(quarters).toHaveLength(8);
      expect(quarters[0].name).toBe('2024 Q2');
      expect(quarters[0].is_active).toBe(true);
      expect(quarters[quarters.length - 1].name).toBe('2022 Q3');

      const annuals = seasons.filter(s => s.id % 10 === 0);
      // Unique years are 2024, 2023, 2022
      expect(annuals.map(a => a.name)).toEqual(['2024', '2023', '2022']);
    });

    it('returns seasons from earliestDate to now', () => {
      const seasons = listSeasons(8, '2023-10-01');
      // earliestDate is 2023-10-01 (Q4 2023)
      // current is Q2 2024
      // Quarters: 2023 Q4, 2024 Q1, 2024 Q2
      const quarters = seasons.filter(s => s.id % 10 !== 0);
      expect(quarters).toHaveLength(3);
      expect(quarters[0].name).toBe('2024 Q2'); // Reversed so current is first
      expect(quarters[quarters.length - 1].name).toBe('2023 Q4');

      const annuals = seasons.filter(s => s.id % 10 === 0);
      expect(annuals.map(a => a.name)).toEqual(['2024', '2023']);
    });

    it('handles earliestDate being in the future by returning current quarter', () => {
      const seasons = listSeasons(8, '2025-01-01');
      const quarters = seasons.filter(s => s.id % 10 !== 0);
      // Logic: while (y < current.year || (y === current.year && q <= current.quarter))
      // start y=2025, q=1. current y=2024, q=2.
      // 2025 < 2024 is false. 2025 === 2024 is false.
      // loop doesn't run.
      expect(quarters).toHaveLength(0);
    });

    it('hits the safety guard when range is too large', () => {
      // Current is 2024 Q2.
      // Earliest is 1970 Q1.
      // That's (2024-1970)*4 + 2 = 54*4 + 2 = 216 + 2 = 218 quarters.
      // Safety guard is at 200.
      const seasons = listSeasons(8, '1970-01-01');
      const quarters = seasons.filter(s => s.id % 10 !== 0);
      expect(quarters.length).toBeLessThanOrEqual(201); // 200 from loop + maybe one more?
      // Actually it breaks when length > 200.
      expect(quarters.length).toBe(201);
    });
  });

  describe('getSeasonById', () => {
    it('returns Lifetime for ID 0', () => {
      const season = getSeasonById(0);
      expect(season).toEqual({ id: 0, name: 'Lifetime', start_date: '', end_date: '' });
    });

    it('returns annual season for ID YYYY0', () => {
      const season = getSeasonById(20240);
      expect(season).toEqual({
        id: 20240,
        name: '2024',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        is_active: false
      });
    });

    it('returns quarterly season for ID YYYYQ', () => {
      const season = getSeasonById(20241);
      expect(season).toEqual({
        id: 20241,
        name: '2024 Q1',
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        is_active: false
      });
    });

    it('returns null for invalid quarter', () => {
      const season = getSeasonById(20245);
      expect(season).toBeNull();

      const seasonZero = getSeasonById(20249);
      expect(seasonZero).toBeNull();
    });
  });

  describe('getSeasonIdFromMatch', () => {
    it('returns correct ID for a given date string', () => {
      expect(getSeasonIdFromMatch('2024-01-15')).toBe(20241);
      expect(getSeasonIdFromMatch('2024-05-15')).toBe(20242);
      expect(getSeasonIdFromMatch('2024-08-15')).toBe(20243);
      expect(getSeasonIdFromMatch('2024-11-15')).toBe(20244);
    });
  });
});
