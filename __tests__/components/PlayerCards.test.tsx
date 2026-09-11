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

  it('renders experience level badge for players', async () => {
    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AdminProvider>
            <PlayerCards />
          </AdminProvider>
        </QueryClientProvider>
      );
    });

    // Alice has 15 total games (< 25) -> Provisional
    expect(await screen.findByText('Provisional')).toBeInTheDocument();
  });

  it('renders mark inactive button on active players with match history and no delete button', async () => {
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
              isActive: true,
            },
          ],
        } as Response);
      }
      if (requestUrl === '/api/players') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, isActive: false }),
        } as Response);
      }
      if (requestUrl === '/api/auth/check') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ isAdmin: true }),
        } as Response);
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) } as Response);
    });

    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AdminProvider>
            <PlayerCards />
          </AdminProvider>
        </QueryClientProvider>
      );
    });

    expect(await screen.findByText('Active Alice')).toBeInTheDocument();

    // Delete button should NOT be present on active player with games
    expect(screen.queryByRole('button', { name: /delete player/i })).not.toBeInTheDocument();

    // Mark inactive button SHOULD be present
    const markInactiveBtn = screen.getByRole('button', { name: /mark player inactive/i });
    expect(markInactiveBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(markInactiveBtn);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/players',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ id: 1, isActive: false }),
      })
    );
  });

  it('displays delete button and confirmation dialog only for players with 0 games', async () => {
    global.fetch = jest.fn().mockImplementation((url: RequestInfo) => {
      const requestUrl = String(url);
      if (requestUrl === '/api/player-stats') {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 99,
              name: 'Zero Game Zack',
              yearsPlayed: 1,
              record: { wins: 0, losses: 0, totalGames: 0 },
              winPercentage: 0,
              totalPlayingTime: 0,
              lastGameDate: null,
              isActive: true,
            },
          ],
        } as Response);
      }
      if (requestUrl === '/api/auth/check') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ isAdmin: true }),
        } as Response);
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) } as Response);
    });

    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AdminProvider>
            <PlayerCards />
          </AdminProvider>
        </QueryClientProvider>
      );
    });

    expect(await screen.findByText('Zero Game Zack')).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: /delete player/i });
    expect(deleteBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    expect(
      screen.getByText(/This player has no match history and will be permanently removed/i)
    ).toBeInTheDocument();
  });

  it('renders manually inactive players with badge and allows marking them active', async () => {
    // Override fetch to include a manually inactive player
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
              isActive: true,
            },
            {
              id: 3,
              name: 'Manual Inactive Charlie',
              yearsPlayed: 1,
              record: { wins: 3, losses: 3, totalGames: 6 },
              winPercentage: 50.0,
              totalPlayingTime: 6,
              lastGameDate: new Date().toISOString(), // recent game but manually marked inactive!
              isActive: false,
            },
          ],
        } as Response);
      }
      if (requestUrl === '/api/players') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 3, isActive: true }),
        } as Response);
      }
      if (requestUrl === '/api/auth/check') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ isAdmin: true }),
        } as Response);
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) } as Response);
    });

    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AdminProvider>
            <PlayerCards />
          </AdminProvider>
        </QueryClientProvider>
      );
    });

    // Expand Inactive Players
    const inactiveToggle = await screen.findByRole('button', { name: /Inactive Players/i });
    await act(async () => {
      fireEvent.click(inactiveToggle);
    });

    expect(screen.getByText('Manual Inactive Charlie')).toBeInTheDocument();
    expect(screen.getByText('Manually Inactive')).toBeInTheDocument();

    // Mark player active button should be present
    const markActiveBtn = screen.getByRole('button', { name: /mark player active/i });
    expect(markActiveBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(markActiveBtn);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/players',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ id: 3, isActive: true }),
      })
    );
  });
});
