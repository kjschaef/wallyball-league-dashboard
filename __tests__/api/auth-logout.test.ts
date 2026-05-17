import { POST } from '@/app/api/auth/logout/route';

const mockCookieStore = {
  delete: jest.fn(),
};

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookieStore),
}));

describe('/api/auth/logout POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes the admin_token cookie and returns success', async () => {
    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockCookieStore.delete).toHaveBeenCalledWith('admin_token');
  });
});
