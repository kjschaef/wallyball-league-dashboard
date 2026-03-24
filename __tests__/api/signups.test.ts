import { POST } from '@/app/api/signups/route';

const mockSql = jest.fn();
const mockCookies = {
  get: jest.fn(),
};

const createMockSql = () => Object.assign(
  jest.fn().mockImplementation((strings: TemplateStringsArray) => {
    const query = strings.join(' ');

    if (query.includes('SELECT signup_open_day_of_week')) {
      return mockSql('settings');
    }

    if (query.includes('SELECT id FROM weekly_signups WHERE player_id')) {
      return mockSql('existing-signup');
    }

    if (query.includes("SELECT count(*) as total FROM weekly_signups WHERE date")) {
      return mockSql('signup-count');
    }

    if (query.includes('INSERT INTO weekly_signups')) {
      return mockSql('insert-signup');
    }

    return mockSql('unknown');
  }),
  {
    transaction: jest.fn(),
  }
);

jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => createMockSql()),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookies),
}));

process.env.DATABASE_URL = 'mock-database-url';

describe('/api/signups POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockCookies.get.mockReturnValue(undefined);
  });

  it('rejects non-admin signups after the close cutoff', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-12T00:30:00.000Z'));

    mockSql.mockImplementation((queryType) => {
      if (queryType === 'settings') {
        return Promise.resolve([{
          signup_open_day_of_week: 0,
          signup_open_time: '12:00',
          signup_close_day_of_week: 0,
          signup_close_time: '16:00',
          available_days: '["Monday","Tuesday","Thursday"]',
        }]);
      }

      return Promise.resolve([]);
    });

    const response = await POST({
      json: async () => ({ playerId: 1, date: '2026-01-19' }),
    } as Request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toEqual({ error: 'Signups are closed for this date' });
    expect(mockSql).toHaveBeenCalledWith('settings');
    expect(mockSql).not.toHaveBeenCalledWith('insert-signup');
  });

  it('accepts non-admin signups during the active window for configured days', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-11T18:30:00.000Z'));

    mockSql.mockImplementation((queryType) => {
      if (queryType === 'settings') {
        return Promise.resolve([{
          signup_open_day_of_week: 0,
          signup_open_time: '12:00',
          signup_close_day_of_week: 0,
          signup_close_time: '16:00',
          available_days: '["Monday","Tuesday","Thursday"]',
        }]);
      }

      if (queryType === 'existing-signup') {
        return Promise.resolve([]);
      }

      if (queryType === 'signup-count') {
        return Promise.resolve([{ total: '2' }]);
      }

      if (queryType === 'insert-signup') {
        return Promise.resolve([{ id: 99, player_id: 1, date: '2026-01-19', status: 'registered' }]);
      }

      return Promise.resolve([]);
    });

    const response = await POST({
      json: async () => ({ playerId: 1, date: '2026-01-19' }),
    } as Request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      signup: { id: 99, player_id: 1, date: '2026-01-19', status: 'registered' },
    });
    expect(mockSql).toHaveBeenCalledWith('insert-signup');
  });
});
