import { GET } from '@/app/api/auth/check/route';

const mockCookieStore = {
  get: jest.fn(),
};

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookieStore),
}));

describe('/api/auth/check GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns isAdmin: true when admin_token is present and equals "true"', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'true' });
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ isAdmin: true });
    expect(mockCookieStore.get).toHaveBeenCalledWith('admin_token');
  });

  it('returns isAdmin: false when admin_token is not present', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ isAdmin: false });
    expect(mockCookieStore.get).toHaveBeenCalledWith('admin_token');
  });

  it('returns isAdmin: false when admin_token does not equal "true"', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'false' });
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ isAdmin: false });
    expect(mockCookieStore.get).toHaveBeenCalledWith('admin_token');
  });
});
