import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlayersPage from '@/app/players/page';

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

jest.mock('@/app/components/PlayerCard', () => ({
  PlayerCard: ({
    player,
    onEdit,
    onDelete,
  }: {
    player: { id: number; name: string; startYear?: number | null };
    onEdit?: (player: { id: number; name: string; startYear?: number | null }) => void;
    onDelete?: (id: number) => void;
  }) => (
    <div>
      <span>{player.name}</span>
      <button type="button" onClick={() => onEdit?.(player)}>
        Edit {player.name}
      </button>
      <button type="button" onClick={() => onDelete?.(player.id)}>
        Delete {player.name}
      </button>
    </div>
  ),
}));

describe('PlayersPage admin authentication flow', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
    alertSpy.mockRestore();
  });

  it('shows admin login when editing a player returns 401 and retries after authentication', async () => {
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 7,
              name: 'Alice',
              startYear: 2020,
              matches: [],
              stats: { won: 0, lost: 0 },
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
          json: async () => ({ id: 7, name: 'Alice Updated', startYear: 2021 }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 7,
              name: 'Alice Updated',
              startYear: 2021,
              matches: [],
              stats: { won: 0, lost: 0 },
            },
          ],
        } as Response)
      );

    render(<PlayersPage />);

    expect(await screen.findByText('Alice')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Edit Alice'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice Updated' } });
    fireEvent.change(screen.getByLabelText('Start Year (optional)'), { target: { value: '2021' } });
    fireEvent.click(screen.getByText('Update Player'));

    expect(await screen.findByText('Finish Admin Login')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Finish Admin Login'));

    await waitFor(() => {
      expect(screen.queryByText('Finish Admin Login')).not.toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/players/7', expect.any(Object));
    expect(global.fetch).toHaveBeenNthCalledWith(3, '/api/players/7', expect.any(Object));
    expect(global.fetch).toHaveBeenNthCalledWith(4, '/api/players');
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('shows admin login when deleting a player returns 401 and retries after authentication', async () => {
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 9,
              name: 'Bob',
              startYear: 2022,
              matches: [],
              stats: { won: 0, lost: 0 },
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
          json: async () => ({}),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response)
      );

    render(<PlayersPage />);

    expect(await screen.findByText('Bob')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Delete Bob'));

    expect(await screen.findByText('Finish Admin Login')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Finish Admin Login'));

    await waitFor(() => {
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/players/9', expect.any(Object));
    expect(global.fetch).toHaveBeenNthCalledWith(3, '/api/players/9', expect.any(Object));
    expect(global.fetch).toHaveBeenNthCalledWith(4, '/api/players');
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
