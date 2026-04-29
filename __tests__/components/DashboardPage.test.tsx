import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '@/app/page';
import { AdminProvider } from '@/app/components/AdminProvider';

const sampleMatch = {
  teamOnePlayers: [1, 2],
  teamTwoPlayers: [3, 4],
  teamOneGamesWon: 3,
  teamTwoGamesWon: 1,
  date: '2026-03-26',
};

jest.mock('@/app/components/PerformanceTrend', () => ({
  PerformanceTrend: () => <div>Performance Trend</div>,
}));

jest.mock('@/app/components/WinPercentageRankings', () => ({
  WinPercentageRankings: () => <div>Win Percentage Rankings</div>,
}));

jest.mock('@/app/components/RecentMatches', () => ({
  RecentMatches: () => <div>Recent Matches</div>,
}));

jest.mock('@/app/components/AISummaryPanel', () => ({
  AISummaryPanel: () => <div>AI Summary Panel</div>,
}));

jest.mock('@/app/components/PlayerSelectorDialog', () => ({
  PlayerSelectorDialog: () => null,
}));

jest.mock('@/app/components/ChatBot', () => ({
  ChatBot: () => null,
}));

jest.mock('@/app/components/FloatingActionButton', () => ({
  FloatingActionButton: ({
    onRecordMatch,
    onAddPlayer,
  }: {
    onRecordMatch: () => void;
    onAddPlayer?: () => void;
  }) => (
    <div>
      <button type="button" onClick={onRecordMatch}>
        Open Record Match
      </button>
      <button type="button" onClick={onAddPlayer}>
        Open Add Player
      </button>
    </div>
  ),
}));

jest.mock('@/app/components/RecordMatchModal', () => ({
  RecordMatchModal: ({
    isOpen,
    onSubmit,
    onClose,
  }: {
    isOpen: boolean;
    onSubmit: (match: typeof sampleMatch) => Promise<boolean>;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div>
        <button type="button" onClick={() => void onSubmit(sampleMatch)}>
          Submit Match
        </button>
        <button type="button" onClick={onClose}>
          Close Match Modal
        </button>
      </div>
    ) : null,
}));

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

describe('DashboardPage admin authentication flow', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
    alertSpy.mockRestore();
  });

  it('shows admin login when match recording returns 401 and retries after authentication', async () => {
    let postCallCount = 0;
    global.fetch = jest.fn().mockImplementation(async (url: any, options: any) => {
      if (url === '/api/auth/check') {
        return { ok: true, json: async () => ({ isAdmin: false }) };
      }
      if (url === '/api/matches' && options?.method === 'POST') {
        postCallCount++;
        if (postCallCount === 1) {
          return { ok: false, status: 401, json: async () => ({ error: 'Unauthorized' }) };
        }
        return { ok: true, json: async () => ({ id: 99 }) };
      }
      return { ok: true, json: async () => [] };
    });

    render(<AdminProvider><DashboardPage /></AdminProvider>);

    fireEvent.click(await screen.findByText('Open Record Match'));
    fireEvent.click(screen.getByText('Submit Match'));

    expect(await screen.findByText('Admin authentication required to record this match.')).toBeInTheDocument();
    expect(screen.getByText('Finish Admin Login')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Finish Admin Login'));

    expect(await screen.findByText('Match recorded successfully.')).toBeInTheDocument();

    expect(global.fetch).toHaveBeenNthCalledWith(3, '/api/matches', expect.any(Object));
    expect(global.fetch).toHaveBeenNthCalledWith(4, '/api/matches', expect.any(Object));
  });

  it('keeps pending match data only until the admin modal is dismissed', async () => {
    let postCallCount = 0;
    global.fetch = jest.fn().mockImplementation(async (url: any, options: any) => {
      if (url === '/api/auth/check') {
        return { ok: true, json: async () => ({ isAdmin: false }) };
      }
      if (url === '/api/matches' && options?.method === 'POST') {
        postCallCount++;
        return { ok: false, status: 401, json: async () => ({ error: 'Unauthorized' }) };
      }
      return { ok: true, json: async () => [] };
    });

    render(<AdminProvider><DashboardPage /></AdminProvider>);

    fireEvent.click(await screen.findByText('Open Record Match'));
    fireEvent.click(screen.getByText('Submit Match'));

    expect(await screen.findByText('Finish Admin Login')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close Admin Login'));

    await waitFor(() => {
      expect(screen.queryByText('Finish Admin Login')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('Admin authentication required to record this match.')).not.toBeInTheDocument();
  });

  it('closes the admin modal and shows an error when retrying the match fails', async () => {
    let postCallCount = 0;
    global.fetch = jest.fn().mockImplementation(async (url: any, options: any) => {
      if (url === '/api/auth/check') {
        return { ok: true, json: async () => ({ isAdmin: false }) };
      }
      if (url === '/api/matches' && options?.method === 'POST') {
        postCallCount++;
        if (postCallCount === 1) {
          return { ok: false, status: 401, json: async () => ({ error: 'Unauthorized' }) };
        }
        return { ok: false, status: 500, json: async () => ({ error: 'Database offline' }) };
      }
      return { ok: true, json: async () => [] };
    });

    render(<AdminProvider><DashboardPage /></AdminProvider>);

    fireEvent.click(await screen.findByText('Open Record Match'));
    fireEvent.click(screen.getByText('Submit Match'));
    fireEvent.click(await screen.findByText('Finish Admin Login'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to record match: Database offline');
    await waitFor(() => {
      expect(screen.queryByText('Finish Admin Login')).not.toBeInTheDocument();
    });
  });

  it('shows admin login when adding a player returns 401 and retries after authentication', async () => {
    let postCallCount = 0;
    global.fetch = jest.fn().mockImplementation(async (url: any, options: any) => {
      if (url === '/api/auth/check') {
        return { ok: true, json: async () => ({ isAdmin: false }) };
      }
      if (url === '/api/players' && options?.method === 'POST') {
        postCallCount++;
        if (postCallCount === 1) {
          return { ok: false, status: 401, json: async () => ({ error: 'Unauthorized' }) };
        }
        return { ok: true, json: async () => ({ id: 101, name: 'Taylor' }) };
      }
      return { ok: true, json: async () => [] };
    });

    render(<AdminProvider><DashboardPage /></AdminProvider>);

    fireEvent.click(await screen.findByText('Open Add Player'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Taylor' } });
    fireEvent.change(screen.getByLabelText('Start Year (Optional)'), { target: { value: '2024' } });
    fireEvent.click(screen.getByText('Add Player'));

    expect(await screen.findByText('Finish Admin Login')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Finish Admin Login'));

    await waitFor(() => {
      expect(screen.queryByText('Finish Admin Login')).not.toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenNthCalledWith(3, '/api/players', expect.any(Object));
    expect(global.fetch).toHaveBeenNthCalledWith(4, '/api/players', expect.any(Object));
    expect(global.fetch).toHaveBeenNthCalledWith(5, '/api/players');
    expect(alertSpy).toHaveBeenCalledWith('Player "Taylor" has been added successfully!');
  });
});
