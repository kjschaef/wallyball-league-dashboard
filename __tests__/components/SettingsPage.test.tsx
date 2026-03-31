import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsPage from '@/app/settings/page';

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn((url: RequestInfo, options?: RequestInit) => {
      const requestUrl = String(url);

      if (requestUrl === '/api/settings' && !options) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            signupOpenDayOfWeek: 0,
            signupOpenTime: '12:00:00',
            signupCloseDayOfWeek: 0,
            signupCloseTime: '16:00:59',
            availableDays: ['Monday', 'Tuesday', 'Thursday'],
          }),
        } as Response);
      }

      if (requestUrl === '/api/settings' && options?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        } as Response);
      }

      if (requestUrl === '/api/auth' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        } as Response);
      }

      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) } as Response);
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('loads settings and saves changes successfully', async () => {
    render(<SettingsPage />);

    expect(await screen.findByText('Site Settings')).toBeInTheDocument();
    expect((screen.getAllByRole('combobox')[0] as HTMLSelectElement).value).toBe('0');
    expect((screen.getAllByDisplayValue('12:00')[0] as HTMLInputElement).value).toBe('12:00');
    expect((screen.getAllByDisplayValue('16:00')[0] as HTMLInputElement).value).toBe('16:00');

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '2' } });
    fireEvent.change(screen.getByPlaceholderText('Leave blank to keep current password'), { target: { value: 'new-secret' } });
    fireEvent.click(screen.getByText('Save All Settings'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/settings',
        expect.objectContaining({ method: 'PUT' })
      );
    });
    expect(await screen.findByText('Settings saved successfully!')).toBeInTheDocument();
  });
});
