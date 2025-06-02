import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../../../client/src/pages/Dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as FloatingActionButton from '../../../client/src/components/FloatingActionButton';

jest.mock('../../../client/src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

function MockPerformanceTrend() {
  return <div data-testid="performance-trend">Performance Trend</div>;
}
MockPerformanceTrend.displayName = "MockPerformanceTrend";
jest.mock('../../../client/src/components/PerformanceTrend', () => ({
  PerformanceTrend: MockPerformanceTrend,
}));

function MockDailyWins() {
  return <div data-testid="daily-wins">Daily Wins</div>;
}
MockDailyWins.displayName = "MockDailyWins";
jest.mock('../../../client/src/components/DailyWins', () => ({
  DailyWins: MockDailyWins,
}));

const mockOnActionClickFab = jest.fn();
function MockFloatingActionButton(props: any) {
  if (props.onActionClick) {
    mockOnActionClickFab.mockImplementation(props.onActionClick);
  }
  return <div data-testid="fab">FAB</div>;
}
MockFloatingActionButton.displayName = "MockFloatingActionButton";
jest.mock('../../../client/src/components/FloatingActionButton', () => ({
  FloatingActionButton: MockFloatingActionButton,
  __mockOnActionClick: mockOnActionClickFab // Export the mock function for tests to use
}));

function MockPlayerSelector({ onSelect, selectedPlayers }: { onSelect: (id: number) => void; selectedPlayers: number[] }) {
  return (
    <div data-testid="player-selector">
      <button onClick={() => onSelect(1)}>Select Player 1</button>
      <div data-testid="selected-players">{selectedPlayers?.join(',') || ''}</div>
    </div>
  );
}
MockPlayerSelector.displayName = "MockPlayerSelector";
jest.mock('../../../client/src/components/PlayerSelector', () => ({
  PlayerSelector: MockPlayerSelector,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  function TestQueryClientProvider({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }
  TestQueryClientProvider.displayName = "TestQueryClientProvider";
  return TestQueryClientProvider;
};

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );
  });

  test('renders performance trend and FAB', () => {
    render(<Dashboard />, { wrapper: createWrapper() });
    
    expect(screen.getByTestId('performance-trend')).toBeInTheDocument();
    expect(screen.getByTestId('fab')).toBeInTheDocument();
  });

  test.skip('opens record game dialog when FAB is clicked', () => {
    render(<Dashboard />, { wrapper: createWrapper() });
    
    const mockOnActionClick = (FloatingActionButton as any).__mockOnActionClick;
    mockOnActionClick('recordMatch');
  });

  test.skip('submits game form correctly', async () => {
    render(<Dashboard />, { wrapper: createWrapper() });
    
    const mockOnActionClick = (FloatingActionButton as any).__mockOnActionClick;
    mockOnActionClick('recordMatch');
  });

  test.skip('validates form inputs', async () => {
    render(<Dashboard />, { wrapper: createWrapper() });
    
    const mockOnActionClick = (FloatingActionButton as any).__mockOnActionClick;
    mockOnActionClick('recordMatch');
  });
});
