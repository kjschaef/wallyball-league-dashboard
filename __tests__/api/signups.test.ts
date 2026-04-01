import { GET, POST, DELETE } from '@/app/api/signups/route';

const mockSql = jest.fn();
const mockCookies = {
  get: jest.fn(),
};

const createMockSql = () => Object.assign(
  jest.fn().mockImplementation((strings: TemplateStringsArray) => {
    const query = strings.join(' ').replace(/\s+/g, ' ').trim().toLowerCase();

    if (query.includes('select signup_open_day_of_week')) {
      return mockSql('settings');
    }

    if (query.includes('select wu.*, p.name') && query.includes('from weekly_unavailable')) {
      return mockSql('unavailable-list');
    }

    if (query.includes('select s.*, p.name') && query.includes('where s.date =')) {
      return mockSql('by-date');
    }

    if (query.includes('select s.*, p.name') && query.includes('where s.player_id =') && query.includes('current_date')) {
      return mockSql('by-player');
    }

    if (query.includes('select s.*, p.name') && query.includes("current_date - interval '7 days'")) {
      return mockSql('recent');
    }

    if (query.includes('select id from weekly_signups where player_id')) {
      return mockSql('existing-signup');
    }

    if (query.includes("select count(*) as total from weekly_signups where date")) {
      return mockSql('signup-count');
    }

    if (query.includes('select id from weekly_unavailable')) {
      return mockSql('existing-unavailable');
    }

    if (query.includes('insert into weekly_unavailable')) {
      return mockSql('insert-unavailable');
    }

    if (query.includes('insert into weekly_signups')) {
      return mockSql('insert-signup');
    }

    if (query.includes('select * from weekly_signups where id =')) {
      return mockSql('lookup-by-id');
    }

    if (query.includes('select * from weekly_signups where player_id =') && query.includes('and date =')) {
      return mockSql('lookup-by-player-date');
    }

    if (query.includes('delete from weekly_unavailable where id =')) {
      return mockSql('delete-unavailable-by-id');
    }

    if (query.includes('delete from weekly_unavailable where player_id =')) {
      return mockSql('delete-unavailable-by-player-week');
    }

    if (query.includes('delete from weekly_signups where id =')) {
      return mockSql('delete-signup');
    }

    if (query.includes("where date =") && query.includes("status = 'waitlisted'") && query.includes('limit 1')) {
      return mockSql('waitlisted');
    }

    if (query.includes("update weekly_signups") && query.includes("set status = 'registered'")) {
      return mockSql('promote-waitlisted');
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

describe('/api/signups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockCookies.get.mockReturnValue(undefined);
    mockSql.mockImplementation(() => Promise.resolve([]));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('GET', () => {
    it('returns signups filtered by date', async () => {
      const signups = [{ id: 1, name: 'Alice', date: '2026-01-19', status: 'registered' }];
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'by-date') {
          return Promise.resolve(signups);
        }

        return Promise.resolve([]);
      });

      const response = await GET({ url: 'http://localhost/api/signups?date=2026-01-19' } as Request);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(signups);
      expect(mockSql).toHaveBeenCalledWith('by-date');
    });

    it('returns upcoming signups for a player', async () => {
      const signups = [{ id: 2, name: 'Alice', date: '2026-01-22', status: 'waitlisted' }];
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'by-player') {
          return Promise.resolve(signups);
        }

        return Promise.resolve([]);
      });

      const response = await GET({ url: 'http://localhost/api/signups?playerId=7' } as Request);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(signups);
      expect(mockSql).toHaveBeenCalledWith('by-player');
    });

    it('returns recent signups when no filters are provided', async () => {
      const signups = [{ id: 3, name: 'Bob', date: '2026-01-20', status: 'registered' }];
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'recent') {
          return Promise.resolve(signups);
        }

        return Promise.resolve([]);
      });

      const response = await GET({ url: 'http://localhost/api/signups' } as Request);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(signups);
      expect(mockSql).toHaveBeenCalledWith('recent');
    });
    it('returns unavailable players only while signups are open', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-11T18:30:00.000Z'));

      const unavailable = [{ id: 2, player_id: 5, name: 'Casey', week_start: '2026-01-18' }];
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

        if (queryType === 'unavailable-list') {
          return Promise.resolve(unavailable);
        }

        return Promise.resolve([]);
      });

      const response = await GET({ url: 'http://localhost/api/signups?unavailable=1' } as Request);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(unavailable);
      expect(mockSql).toHaveBeenCalledWith('unavailable-list');
    });
  });

  describe('POST', () => {
    it('rejects requests missing required fields', async () => {
      const response = await POST({
        json: async () => ({ playerId: 1 }),
      } as Request);

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'playerId and date are required' });
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

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: 'Signups are closed for this date' });
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

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        success: true,
        signup: { id: 99, player_id: 1, date: '2026-01-19', status: 'registered' },
      });
      expect(mockSql).toHaveBeenCalledWith('insert-signup');
    });

    it('rejects duplicate signups', async () => {
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
          return Promise.resolve([{ id: 11 }]);
        }

        return Promise.resolve([]);
      });

      const response = await POST({
        json: async () => ({ playerId: 1, date: '2026-01-19' }),
      } as Request);

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Player already signed up for this date' });
      expect(mockSql).not.toHaveBeenCalledWith('insert-signup');
    });

    it('waitlists players after six registered signups', async () => {
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
          return Promise.resolve([{ total: '6' }]);
        }

        if (queryType === 'insert-signup') {
          return Promise.resolve([{ id: 100, player_id: 7, date: '2026-01-19', status: 'waitlisted' }]);
        }

        return Promise.resolve([]);
      });

      const response = await POST({
        json: async () => ({ playerId: 7, date: '2026-01-19' }),
      } as Request);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        success: true,
        signup: { id: 100, player_id: 7, date: '2026-01-19', status: 'waitlisted' },
      });
    });


    it('creates an unavailable RSVP during open signups', async () => {
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

        if (queryType === 'existing-unavailable') {
          return Promise.resolve([]);
        }

        if (queryType === 'insert-unavailable') {
          return Promise.resolve([{ id: 14, player_id: 3, week_start: '2026-01-18' }]);
        }

        return Promise.resolve([]);
      });

      const response = await POST({
        json: async () => ({ playerId: 3, unavailable: true }),
      } as Request);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        success: true,
        unavailable: { id: 14, player_id: 3, week_start: '2026-01-18' },
      });
      expect(mockSql).toHaveBeenCalledWith('insert-unavailable');
    });

    it('allows admins to bypass the signup window check', async () => {
      mockCookies.get.mockReturnValue({ value: 'true' });
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'existing-signup') {
          return Promise.resolve([]);
        }

        if (queryType === 'signup-count') {
          return Promise.resolve([{ total: '0' }]);
        }

        if (queryType === 'insert-signup') {
          return Promise.resolve([{ id: 101, player_id: 3, date: '2026-01-27', status: 'registered' }]);
        }

        return Promise.resolve([]);
      });

      const response = await POST({
        json: async () => ({ playerId: 3, date: '2026-01-27' }),
      } as Request);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        success: true,
        signup: { id: 101, player_id: 3, date: '2026-01-27', status: 'registered' },
      });
      expect(mockSql).toHaveBeenCalledWith('insert-signup');
    });
  });

  describe('DELETE', () => {
    it('requires an id or player/date pair', async () => {
      const response = await DELETE({
        json: async () => ({}),
      } as Request);

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'id or (playerId and date) required' });
    });

    it('returns 404 when the signup is missing', async () => {
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'lookup-by-id') {
          return Promise.resolve([]);
        }

        return Promise.resolve([]);
      });

      const response = await DELETE({
        json: async () => ({ id: 55 }),
      } as Request);

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ error: 'Signup not found' });
    });

    it('promotes the first waitlisted signup after deleting a registered player', async () => {
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'lookup-by-id') {
          return Promise.resolve([{ id: 5, date: '2026-01-19', status: 'registered' }]);
        }

        if (queryType === 'delete-signup') {
          return Promise.resolve([]);
        }

        if (queryType === 'waitlisted') {
          return Promise.resolve([{ id: 9 }]);
        }

        if (queryType === 'promote-waitlisted') {
          return Promise.resolve([]);
        }

        return Promise.resolve([]);
      });

      const response = await DELETE({
        json: async () => ({ id: 5 }),
      } as Request);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ success: true });
      expect(mockSql).toHaveBeenCalledWith('promote-waitlisted');
    });


    it('removes an unavailable RSVP by id', async () => {
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'delete-unavailable-by-id') {
          return Promise.resolve([]);
        }

        return Promise.resolve([]);
      });

      const response = await DELETE({
        json: async () => ({ id: 31, unavailable: true }),
      } as Request);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ success: true });
      expect(mockSql).toHaveBeenCalledWith('delete-unavailable-by-id');
    });

    it('deletes a waitlisted signup by player/date without promoting anyone', async () => {
      mockSql.mockImplementation((queryType) => {
        if (queryType === 'lookup-by-player-date') {
          return Promise.resolve([{ id: 7, date: '2026-01-19', status: 'waitlisted' }]);
        }

        if (queryType === 'delete-signup') {
          return Promise.resolve([]);
        }

        return Promise.resolve([]);
      });

      const response = await DELETE({
        json: async () => ({ playerId: 3, date: '2026-01-19' }),
      } as Request);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ success: true });
      expect(mockSql).not.toHaveBeenCalledWith('waitlisted');
      expect(mockSql).not.toHaveBeenCalledWith('promote-waitlisted');
    });
  });
});
