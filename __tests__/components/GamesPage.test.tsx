import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GamesPage from '@/app/games/page';
import { AdminProvider } from '@/app/components/AdminProvider';

jest.mock('@/app/components/AdminLoginModal', () => ({
  AdminLoginModal: ({
    isOpen,
    onSuccess,
    onClose,
  }: {
    isOpen: boolean;
    onSuccess: () => Promise<boolean>;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div>
        <button type="button" onClick={() => void onSuccess()}>
          Finish Admin Login
        </button>
        <button type="button" onClick={onClose}>
          Close Admin Login
        </button>
      </div>
    ) : null,
}));

describe('GamesPage admin authentication flow', () => {
  let confirmSpy: jest.SpyInstance;
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('shows admin login when deleting a match returns 401 and retries after authentication', async () => {
    let matches = [
      {
        id: 12,
        date: '2026-03-26T12:00:00.000Z',
        teamOnePlayers: ['Alice', 'Bob'],
        teamTwoPlayers: ['Carol', 'Dave'],
        teamOneGamesWon: 3,
        teamTwoGamesWon: 1,
      },
    ];
    let deleteCallCount = 0;
    global.fetch = jest.fn().mockImplementation(async (url: any, options: any) => {
      if (url === '/api/auth/check') {
        return { ok: true, json: async () => ({ isAdmin: false }) };
      }
      if (options?.method === 'DELETE') {
        deleteCallCount++;
        if (deleteCallCount === 1) {
          return { ok: false, status: 401, json: async () => ({ error: 'Unauthorized' }) };
        }
        matches = [];
        return { ok: true, json: async () => ({ message: 'Match deleted successfully' }) };
      }
      return {
        ok: true,
        json: async () => matches,
      };
    });

    render(<AdminProvider><GamesPage /></AdminProvider>);

    expect(await screen.findByText('Alice and Bob')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Delete match'));

    expect(await screen.findByText('Finish Admin Login')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Finish Admin Login'));

    await waitFor(() => {
      expect(screen.queryByText('Alice and Bob')).not.toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenNthCalledWith(3, '/api/matches/12', expect.any(Object));
    expect(global.fetch).toHaveBeenNthCalledWith(4, '/api/matches/12', expect.any(Object));
    expect(global.fetch).toHaveBeenNthCalledWith(5, '/api/matches');
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
