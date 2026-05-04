const mockCookieStore = {
  get: jest.fn(),
};

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookieStore),
}));

import { GET } from '@/app/api/auth/check/route';

describe('/api/auth/check GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns isAdmin: true when admin_token cookie is "true"', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'true' });

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({ isAdmin: true });
    expect(mockCookieStore.get).toHaveBeenCalledWith('admin_token');
  });

  it('returns isAdmin: false when admin_token cookie is not "true"', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'false' });

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({ isAdmin: false });
  });

  it('returns isAdmin: false when admin_token cookie is missing', async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({ isAdmin: false });
  });
});
