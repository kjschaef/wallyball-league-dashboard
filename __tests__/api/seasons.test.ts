import { NextRequest } from 'next/server';
import { GET } from '@/app/api/seasons/route';
import { GET as getCurrentSeason } from '@/app/api/seasons/current/route';

// Mock the neon database connection
const mockSql = jest.fn();

const createMockSql = () => {
  return Object.assign(
    jest.fn().mockImplementation((strings: TemplateStringsArray, ...values: any[]) => {
      const query = strings.join('').toLowerCase();
      if (query.includes('select * from seasons')) {
        return mockSql('seasons');
      }
      return mockSql('unknown');
    }),
    {
      transaction: jest.fn(),
    }
  );
};

jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => createMockSql()),
}));

// Mock Next.js environment
process.env.DATABASE_URL = 'mock-database-url';

describe('/api/seasons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/seasons', () => {
    it('should return all seasons ordered by start_date descending', async () => {
      const mockSeasons = [
        {
          id: 3,
          name: '2025 Q3',
          start_date: '2025-07-01',
          end_date: '2025-09-30',
          is_active: true,
          created_at: '2025-06-01T00:00:00.000Z'
        },
        {
          id: 2,
          name: '2025 Q2',
          start_date: '2025-04-01',
          end_date: '2025-06-30',
          is_active: false,
          created_at: '2025-03-01T00:00:00.000Z'
        },
        {
          id: 1,
          name: '2025 Q1',
          start_date: '2025-01-01',
          end_date: '2025-03-31',
          is_active: false,
          created_at: '2025-01-01T00:00:00.000Z'
        }
      ];

      mockSql.mockResolvedValue(mockSeasons);

      const request = new NextRequest('http://localhost:3000/api/seasons');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSeasons);
      expect(mockSql).toHaveBeenCalledWith('seasons');
    });

    it('should return empty array when no seasons exist', async () => {
      mockSql.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/seasons');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockSql.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/seasons');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch seasons');
    });
  });

  describe('GET /api/seasons/current', () => {
    it('should return the currently active season', async () => {
      const mockActiveSeason = {
        id: 3,
        name: '2025 Q3',
        start_date: '2025-07-01',
        end_date: '2025-09-30',
        is_active: true,
        created_at: '2025-06-01T00:00:00.000Z'
      };

      mockSql.mockResolvedValue([mockActiveSeason]);

      const request = new NextRequest('http://localhost:3000/api/seasons/current');
      const response = await getCurrentSeason(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockActiveSeason);
    });

    it('should create and return a new active season when none exists', async () => {
      // Sequence of DB calls:
      // 1) activeSeasons query -> []
      // 2) select by name -> []
      // 3) insert -> returns inserted row
      const insertedSeason = {
        id: 10,
        name: '2025 Q4',
        start_date: '2025-10-01',
        end_date: '2025-12-31',
        is_active: true,
        created_at: '2025-10-01T00:00:00.000Z'
      };

      mockSql
        .mockResolvedValueOnce([]) // activeSeasons
        .mockResolvedValueOnce([]) // select by name
        .mockResolvedValueOnce([insertedSeason]); // insert returning

      const request = new NextRequest('http://localhost:3000/api/seasons/current');
      const response = await getCurrentSeason(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(insertedSeason);
    });

    it('should handle multiple active seasons by returning the first one', async () => {
      const mockActiveSeasons = [
        {
          id: 3,
          name: '2025 Q3',
          start_date: '2025-07-01',
          end_date: '2025-09-30',
          is_active: true,
          created_at: '2025-06-01T00:00:00.000Z'
        },
        {
          id: 4,
          name: '2025 Q4',
          start_date: '2025-10-01',
          end_date: '2025-12-31',
          is_active: true,
          created_at: '2025-09-01T00:00:00.000Z'
        }
      ];

      mockSql.mockResolvedValue(mockActiveSeasons);

      const request = new NextRequest('http://localhost:3000/api/seasons/current');
      const response = await getCurrentSeason(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockActiveSeasons[0]);
    });
  });
});

describe('Season utility functions', () => {
  describe('getCurrentSeasonByDate', () => {
    // This will be a utility function to determine season based on date
    const getCurrentSeasonByDate = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // getMonth() is 0-indexed
      
      if (month >= 1 && month <= 3) {
        return {
          name: `${year} Q1`,
          start_date: `${year}-01-01`,
          end_date: `${year}-03-31`
        };
      } else if (month >= 4 && month <= 6) {
        return {
          name: `${year} Q2`,
          start_date: `${year}-04-01`,
          end_date: `${year}-06-30`
        };
      } else if (month >= 7 && month <= 9) {
        return {
          name: `${year} Q3`,
          start_date: `${year}-07-01`,
          end_date: `${year}-09-30`
        };
      } else {
        return {
          name: `${year} Q4`,
          start_date: `${year}-10-01`,
          end_date: `${year}-12-31`
        };
      }
    };

    it('should identify Q1 season for January dates', () => {
      const date = new Date('2025-01-15');
      const season = getCurrentSeasonByDate(date);
      
      expect(season.name).toBe('2025 Q1');
      expect(season.start_date).toBe('2025-01-01');
      expect(season.end_date).toBe('2025-03-31');
    });

    it('should identify Q2 season for April dates', () => {
      const date = new Date('2025-04-15');
      const season = getCurrentSeasonByDate(date);
      
      expect(season.name).toBe('2025 Q2');
      expect(season.start_date).toBe('2025-04-01');
      expect(season.end_date).toBe('2025-06-30');
    });

    it('should identify Q3 season for July dates', () => {
      const date = new Date('2025-07-15');
      const season = getCurrentSeasonByDate(date);
      
      expect(season.name).toBe('2025 Q3');
      expect(season.start_date).toBe('2025-07-01');
      expect(season.end_date).toBe('2025-09-30');
    });

    it('should identify Q4 season for December dates', () => {
      const date = new Date('2025-12-15');
      const season = getCurrentSeasonByDate(date);
      
      expect(season.name).toBe('2025 Q4');
      expect(season.start_date).toBe('2025-10-01');
      expect(season.end_date).toBe('2025-12-31');
    });
  });
});
