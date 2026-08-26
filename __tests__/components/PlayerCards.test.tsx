import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlayerCards } from '@/app/components/PlayerCards';
import { AdminProvider } from '@/app/components/AdminProvider';

describe('PlayerCards', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    global.fetch = jest.fn().mockImplementation((url: RequestInfo) => {
      const requestUrl = String(url);
      if (requestUrl === '/api/player-stats') {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 1,
              name: 'Active Alice',
              yearsPlayed: 2,
              record: { wins: 10, losses: 5, totalGames: 15 },
              winPercentage: 66.7,
              totalPlayingTime: 20,
              lastGameDate: new Date().toISOString(),
            },
            {
              id: 2,
              name: 'Inactive Bob',
              yearsPlayed: 3,
              record: { wins: 5, losses: 5, totalGames: 10 },
              winPercentage: 50.0,
              totalPlayingTime: 10,
              lastGameDate: '2024-01-01T00:00:00.000Z',
            },
          ],
        } as Response);
      }
      if (requestUrl === '/api/auth/check') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ isAdmin: false }),
        } as Response);
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) } as Response);
    });
  });

  it('renders active players and keeps inactive players collapsed by default', async () => {
    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AdminProvider>
            <PlayerCards />
          </AdminProvider>
        </QueryClientProvider>
      );
    });

    // Active player card should be visible
    expect(await screen.findByText('Active Alice')).toBeInTheDocument();

    // Inactive player card should NOT be visible initially
    expect(screen.queryByText('Inactive Bob')).not.toBeInTheDocument();

    // Collapsible toggle for Inactive Players should be rendered
    const inactiveToggle = screen.getByRole('button', { name: /Inactive Players/i });
    expect(inactiveToggle).toBeInTheDocument();
    expect(inactiveToggle).toHaveAttribute('aria-expanded', 'false');

    // Click to expand inactive players
    await act(async () => {
      fireEvent.click(inactiveToggle);
    });

    expect(inactiveToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Inactive Bob')).toBeInTheDocument();

    // Click again to collapse
    await act(async () => {
      fireEvent.click(inactiveToggle);
    });

    expect(inactiveToggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Inactive Bob')).not.toBeInTheDocument();
  });
});
