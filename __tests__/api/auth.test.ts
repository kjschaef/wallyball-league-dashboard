const mockSql = jest.fn();
const mockCookieStore = {
  set: jest.fn(),
};

const createMockSql = () =>
  Object.assign(
    jest.fn().mockImplementation((strings: TemplateStringsArray) => {
      const query = strings.join(' ').replace(/\s+/g, ' ').trim().toLowerCase();

      if (query.includes('select admin_password_hash from site_settings limit 1')) {
        return mockSql('settings');
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

import { POST } from '@/app/api/auth/route';
import { hashPassword } from '@/app/lib/auth';

describe('/api/auth POST', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalAdminPassword = process.env.ADMIN_PASSWORD;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = 'mock-database-url';
    process.env.ADMIN_PASSWORD = 'fallback-secret';
    mockSql.mockImplementation(() => Promise.resolve([]));
  });

  afterAll(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.ADMIN_PASSWORD = originalAdminPassword;
  });

  it('authenticates against the stored hashed admin password and sets the cookie', async () => {
    const password = 'stored-secret';
    const hashedPassword = hashPassword(password);

    mockSql.mockImplementation((queryType) => {
      if (queryType === 'settings') {
        return Promise.resolve([{ admin_password_hash: hashedPassword }]);
      }

      return Promise.resolve([]);
    });

    const response = await POST({
      json: async () => ({ password }),
    } as Request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'admin_token',
      'true',
      expect.objectContaining({ httpOnly: true, sameSite: 'strict' })
    );
  });

  it('authenticates against legacy plaintext passwords', async () => {
    mockSql.mockImplementation((queryType) => {
      if (queryType === 'settings') {
        return Promise.resolve([{ admin_password_hash: 'legacy-plaintext' }]);
      }

      return Promise.resolve([]);
    });

    const response = await POST({
      json: async () => ({ password: 'legacy-plaintext' }),
    } as Request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockCookieStore.set).toHaveBeenCalled();
  });

  it('falls back to the environment password when settings are empty', async () => {
    const response = await POST({
      json: async () => ({ password: 'fallback-secret' }),
    } as Request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockCookieStore.set).toHaveBeenCalled();
  });

  it('rejects invalid passwords', async () => {
    mockSql.mockImplementation((queryType) => {
      if (queryType === 'settings') {
        return Promise.resolve([{ admin_password_hash: 'stored-secret' }]);
      }

      return Promise.resolve([]);
    });

    const response = await POST({
      json: async () => ({ password: 'wrong' }),
    } as Request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid password' });
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  it('handles database errors gracefully', async () => {
    mockSql.mockImplementation(() => {
      return Promise.reject(new Error('Database connection failed'));
    });

    const originalConsoleError = console.error;
    console.error = jest.fn();

    const response = await POST({
      json: async () => ({ password: 'some-password' }),
    } as Request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to authenticate' });
    expect(console.error).toHaveBeenCalled();

    console.error = originalConsoleError;
  });
});
