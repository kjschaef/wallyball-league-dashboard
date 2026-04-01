import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignupsPage from '@/app/signups/page';

describe('SignupsPage', () => {
  const alertMock = jest.fn();
  const confirmMock = jest.fn(() => true);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-01-11T18:30:00.000Z'));
    window.alert = alertMock;
    window.confirm = confirmMock;
    global.alert = alertMock;
    global.confirm = confirmMock;
    global.fetch = jest.fn((url: RequestInfo, options?: RequestInit) => {
      const requestUrl = String(url);

      if (requestUrl === '/api/settings') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            signupOpenDayOfWeek: 0,
            signupOpenTime: '12:00',
            signupCloseDayOfWeek: 0,
            signupCloseTime: '16:00',
            availableDays: ['Monday', 'Thursday'],
          }),
        } as Response);
      }

      if (requestUrl === '/api/players') {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
          ],
        } as Response);
      }

      if (requestUrl === '/api/signups' && (!options || !options.method)) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, player_id: 2, name: 'Bob', date: '2026-01-19', status: 'registered', created_at: '2026-01-10T00:00:00.000Z' },
          ],
        } as Response);
      }

      if (requestUrl === '/api/signups?unavailable=1') {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 11, player_id: 1, name: 'Alice', week_start: '2026-01-18', created_at: '2026-01-10T00:00:00.000Z' },
          ],
        } as Response);
      }

      if (requestUrl === '/api/signups' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        } as Response);
      }

      if (requestUrl === '/api/signups' && options?.method === 'DELETE') {
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
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('loads the open signup state and submits a signup for the selected player', async () => {
    render(<SignupsPage />);

    expect(await screen.findByText('Weekly Signups')).toBeInTheDocument();
    expect(await screen.findByText('Monday, January 19th')).toBeInTheDocument();
    expect(screen.queryByText('Tuesday, January 20th')).not.toBeInTheDocument();
    expect(screen.getByText('Thursday, January 22nd')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    fireEvent.click(screen.getAllByText('Sign Up')[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/signups',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('renders existing signup entries with remove controls', async () => {
    render(<SignupsPage />);

    expect(await screen.findByTitle('Remove player')).toBeInTheDocument();
    expect(screen.getAllByTitle('Remove player')).toHaveLength(1);
    expect(screen.getByText('1.')).toBeInTheDocument();
  });

  it('renders unavailable players with remove controls', async () => {
    render(<SignupsPage />);

    expect(await screen.findByTitle('Remove unavailable player')).toBeInTheDocument();
  });
});
