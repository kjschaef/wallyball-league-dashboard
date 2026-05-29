const mockSql = jest.fn();
const mockCookieStore = {
  get: jest.fn(),
};

const createMockSql = () =>
  Object.assign(
    jest.fn().mockImplementation((strings: TemplateStringsArray) => {
      const query = strings.join(' ').replace(/\s+/g, ' ').trim().toLowerCase();

      if (query.includes('select * from site_settings limit 1')) {
        return mockSql('settings');
      }

      if (query.includes('select id from site_settings limit 1')) {
        return mockSql('existing');
      }

      if (query.includes('update site_settings')) {
        return mockSql('update');
      }

      if (query.includes('insert into site_settings')) {
        return mockSql('insert');
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
  cookies: jest.fn(() => mockCookieStore),
}));

import { GET, PUT } from '@/app/api/settings/route';

let consoleSpy: jest.SpyInstance;

describe('/api/settings', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress expected console.error logs to clean up test output
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.DATABASE_URL = 'mock-database-url';
    mockCookieStore.get.mockReturnValue(undefined);
    mockSql.mockImplementation(() => Promise.resolve([]));
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  afterAll(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('returns stored settings when present', async () => {
    mockSql.mockImplementation((queryType) => {
      if (queryType === 'settings') {
        return Promise.resolve([{
          signup_open_day_of_week: 2,
          signup_open_time: '10:00:00',
          signup_close_day_of_week: 3,
          signup_close_time: '14:00:59',
          available_days: '["Tuesday","Thursday"]',
        }]);
      }

      return Promise.resolve([]);
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      signupOpenDayOfWeek: 2,
      signupOpenTime: '10:00',
      signupCloseDayOfWeek: 3,
      signupCloseTime: '14:00',
      availableDays: ['Tuesday', 'Thursday'],
    });
  });

  it('returns default settings when none are stored', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      signupOpenDayOfWeek: 0,
      signupOpenTime: '12:00',
      signupCloseDayOfWeek: 0,
      signupCloseTime: '16:00',
      availableDays: ['Monday', 'Tuesday', 'Thursday'],
    });
  });

  it('rejects unauthenticated updates', async () => {
    const response = await PUT({
      json: async () => ({ signupOpenDayOfWeek: 1 }),
    } as Request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('updates an existing settings row for admins', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'true' });
    mockSql.mockImplementation((queryType) => {
      if (queryType === 'existing') {
        return Promise.resolve([{ id: 1 }]);
      }

      return Promise.resolve([]);
    });

    const response = await PUT({
      json: async () => ({
        signupOpenDayOfWeek: 1,
        signupOpenTime: '09:00',
        signupCloseDayOfWeek: 2,
        signupCloseTime: '15:00',
        availableDays: ['Monday'],
        adminPassword: 'secret',
      }),
    } as Request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockSql).toHaveBeenCalledWith('update');
  });

  it('inserts a settings row when one does not exist', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'true' });
    mockSql.mockImplementation((queryType) => {
      if (queryType === 'existing') {
        return Promise.resolve([]);
      }

      return Promise.resolve([]);
    });

    const response = await PUT({
      json: async () => ({
        signupOpenDayOfWeek: 4,
        signupOpenTime: '11:00',
        availableDays: ['Thursday'],
      }),
    } as Request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockSql).toHaveBeenCalledWith('insert');
  });


  it('handles GET error when DATABASE_URL is missing', async () => {
    const orig = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const response = await GET();
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({ error: 'Failed to fetch settings' });
    } finally {
      process.env.DATABASE_URL = orig;
    }
  });

  it('handles PUT error when DATABASE_URL is missing', async () => {
    const orig = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      mockCookieStore.get.mockReturnValue({ value: 'true' });
      const response = await PUT({
        json: async () => ({}),
      } as Request);
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({ error: 'Failed to update settings' });
    } finally {
      process.env.DATABASE_URL = orig;
    }
  });

  it('handles GET error gracefully', async () => {
    mockSql.mockImplementation(() => Promise.reject(new Error('Mock DB Error')));
    const response = await GET();
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to fetch settings' });
  });

  it('handles PUT error gracefully', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'true' });
    mockSql.mockImplementation(() => Promise.reject(new Error('Mock DB Error')));
    const response = await PUT({
      json: async () => ({}),
    } as Request);
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to update settings' });
  });

  it('uses default fallback values when db settings have null values for GET', async () => {
    mockSql.mockImplementation((queryType) => {
      if (queryType === 'settings') {
        return Promise.resolve([{
          signup_open_day_of_week: null,
          signup_open_time: null,
          signup_close_day_of_week: null,
          signup_close_time: null,
          available_days: null,
        }]);
      }
      return Promise.resolve([]);
    });

    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      signupOpenDayOfWeek: 0,
      signupOpenTime: '12:00',
      signupCloseDayOfWeek: 0,
      signupCloseTime: '16:00',
      availableDays: ['Monday', 'Tuesday', 'Thursday'],
    });
  });

  it('uses default fallback values when payload values are missing for PUT insert', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'true' });
    mockSql.mockImplementation((queryType) => {
      if (queryType === 'existing') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    const response = await PUT({
      json: async () => ({
        signupOpenTime: null,
        signupCloseTime: null,
        signupOpenDayOfWeek: null,
        signupCloseDayOfWeek: null,
        availableDays: null,
        adminPassword: null,
      }),
    } as Request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockSql).toHaveBeenCalledWith('insert');
  });

  it('uses default fallback values when payload values are missing for PUT update', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'true' });
    mockSql.mockImplementation((queryType) => {
      if (queryType === 'existing') {
        return Promise.resolve([{ id: 1 }]);
      }
      return Promise.resolve([]);
    });

    const response = await PUT({
      json: async () => ({
        signupOpenTime: null,
        signupCloseTime: null,
        signupOpenDayOfWeek: null,
        signupCloseDayOfWeek: null,
        availableDays: null,
        adminPassword: null,
      }),
    } as Request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockSql).toHaveBeenCalledWith('update');
  });
});
