const mockCookieStore = {
  delete: jest.fn(),
};

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookieStore),
}));

import { POST } from '@/app/api/auth/logout/route';

describe('/api/auth/logout POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes the admin_token cookie and returns success', async () => {
    const response = await POST();
    const data = await response.json();

    expect(data).toEqual({ success: true });
    expect(mockCookieStore.delete).toHaveBeenCalledWith('admin_token');
  });
});
