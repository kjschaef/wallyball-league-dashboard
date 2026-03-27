import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GamesPage from '@/app/games/page';

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
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 12,
              date: '2026-03-26T12:00:00.000Z',
              teamOnePlayers: ['Alice', 'Bob'],
              teamTwoPlayers: ['Carol', 'Dave'],
              teamOneGamesWon: 3,
              teamTwoGamesWon: 1,
            },
          ],
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Match deleted successfully' }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response)
      );

    render(<GamesPage />);

    expect(await screen.findByText('Alice and Bob')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Delete match'));

    expect(await screen.findByText('Finish Admin Login')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Finish Admin Login'));

    await waitFor(() => {
      expect(screen.queryByText('Alice and Bob')).not.toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/matches/12', expect.any(Object));
    expect(global.fetch).toHaveBeenNthCalledWith(3, '/api/matches/12', expect.any(Object));
    expect(global.fetch).toHaveBeenNthCalledWith(4, '/api/matches');
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
