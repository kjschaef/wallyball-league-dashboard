import { NextRequest } from 'next/server';
import { GET } from '@/app/api/player-trends/route';

const mockSql = jest.fn();

const createMockSql = () =>
  Object.assign(
    jest.fn().mockImplementation((strings: TemplateStringsArray, ...values: any[]) => {
      const query = strings.join('').toLowerCase();
      if (query.includes('select * from players')) {
        return mockSql('players');
      }
      if (query.includes('select * from matches')) {
        return mockSql('matches');
      }
      return mockSql('unknown');
    }),
    { transaction: jest.fn() }
  );

jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => createMockSql()),
}));


const { neon } = require('@neondatabase/serverless') as { neon: jest.Mock };
const originalDbUrl = process.env.DATABASE_URL;

beforeEach(() => {
  process.env.DATABASE_URL = 'mock-db-url';
  jest.clearAllMocks();
});

afterEach(() => {
  process.env.DATABASE_URL = originalDbUrl;
  jest.useRealTimers();
});

describe('/api/player-trends', () => {


  it('returns 404 when a requested season cannot be resolved', async () => {
    mockSql.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/player-trends?season=9999');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Season not found' });
    expect(mockSql).not.toHaveBeenCalled();
    expect(neon).toHaveBeenCalledTimes(1);
  });
});
