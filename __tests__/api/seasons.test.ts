import { NextRequest } from 'next/server';
import { GET as getSeasonsRoute } from '@/app/api/seasons/route';
import { GET as getCurrentSeasonRoute } from '@/app/api/seasons/current/route';
import {
  getCurrentSeasonByDate,
  getSeasonById,
  getSeasonIdFromMatch,
  listSeasons
} from '@/lib/seasons';

jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(),
}));

const { neon } = require('@neondatabase/serverless') as { neon: jest.Mock };
const originalDbUrl = process.env.DATABASE_URL;

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
  process.env.DATABASE_URL = originalDbUrl;
});

describe('/api/seasons', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'mock-database-url';
  });

  describe('GET /api/seasons', () => {
    it('computes seasons based on earliest match date when database is available', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-02-15T00:00:00.000Z'));
      const sqlMock = jest.fn().mockImplementation((strings: TemplateStringsArray) => {
        const query = strings.join(' ').toLowerCase();
        if (query.includes('select min(date)')) {
          return Promise.resolve([{ min_date: '2024-07-10T12:00:00.000Z' }]);
        }
        return Promise.reject(new Error(`Unexpected query: ${query}`));
      });
      neon.mockReturnValue(sqlMock);

      const request = new NextRequest('http://localhost:3000/api/seasons');
      const response = await getSeasonsRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(5);
      expect(data[0]).toMatchObject({ name: '2025 Q1', is_active: true });
      expect(data[1]).toMatchObject({ name: '2024 Q4' });
      expect(data[2]).toMatchObject({ name: '2024 Q3' });
      expect(sqlMock).toHaveBeenCalledTimes(1);
    });

    it('falls back to computed seasons when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL;
      jest.useFakeTimers().setSystemTime(new Date('2025-02-15T00:00:00.000Z'));

      const request = new NextRequest('http://localhost:3000/api/seasons');
      const response = await getSeasonsRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.length).toBe(17); // 12 computed + lifetime + annuals
      expect(data[0]).toMatchObject({ name: '2025 Q1', is_active: true });
      expect(data[data.length - 1]).toMatchObject({ name: 'Lifetime', id: 0 });
      expect(neon).not.toHaveBeenCalled();
    });

    it('handles database errors gracefully', async () => {
      const sqlMock = jest.fn().mockImplementation(() => Promise.reject(new Error('Database down')));
      neon.mockReturnValue(sqlMock);

      const request = new NextRequest('http://localhost:3000/api/seasons');
      const response = await getSeasonsRoute(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch seasons' });
    });
  });

  describe('GET /api/seasons/current', () => {
    it('returns the computed current season for today', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-05-10T12:00:00.000Z'));

      const request = new NextRequest('http://localhost:3000/api/seasons/current');
      const response = await getCurrentSeasonRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        id: null,
        name: '2025 Q2',
        start_date: '2025-04-01',
        end_date: '2025-06-30',
        is_active: true,
      });
    });

    it('propagates errors from the season helper', async () => {
      const helperSpy = jest.spyOn(require('@/lib/seasons'), 'getCurrentSeasonByDate').mockImplementation(() => {
        throw new Error('helper failed');
      });

      const request = new NextRequest('http://localhost:3000/api/seasons/current');
      const response = await getCurrentSeasonRoute(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch current season' });

      helperSpy.mockRestore();
    });
  });
});

describe('lib/seasons utilities', () => {
  it('identifies correct quarter for a given date', () => {
    expect(getCurrentSeasonByDate(new Date('2025-01-15'))).toEqual({
      name: '2025 Q1',
      start_date: '2025-01-01',
      end_date: '2025-03-31',
    });

    expect(getCurrentSeasonByDate(new Date('2025-07-10'))).toEqual({
      name: '2025 Q3',
      start_date: '2025-07-01',
      end_date: '2025-09-30',
    });
  });

  it('lists recent seasons with current quarter first', () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-02-15T00:00:00.000Z'));
    const seasons = listSeasons(4);

    expect(seasons).toHaveLength(6);
    expect(seasons[0]).toMatchObject({ name: '2025 Q1', is_active: true, id: 20251 });
    expect(seasons[3]).toMatchObject({ name: '2024 Q2' });
  });

  it('retrieves season metadata by identifier', () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-02-15T00:00:00.000Z'));
    const seasons = listSeasons(6);

    const target = seasons[2];
    expect(getSeasonById(target.id)).toEqual(target);
    expect(getSeasonById(0)).toEqual({ id: 0, name: 'Lifetime', start_date: '', end_date: '' });
    expect(getSeasonById(9999)).toBeNull();
  });

  it('maps match dates to the correct season', () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-02-15T00:00:00.000Z'));
    const seasons = listSeasons(6);

    const sampleSeason = seasons.find((s) => s.name === '2024 Q3');
    expect(sampleSeason).toBeTruthy();
    const seasonId = getSeasonIdFromMatch('2024-08-15', seasons);
    expect(seasonId).toBe(sampleSeason?.id || null);

    // Date outside known range returns null
    // expect(getSeasonIdFromMatch('2010-01-01', seasons)).toBeNull();
  });
});
