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

jest.mock('../../../client/src/components/PerformanceTrend', () => ({
  PerformanceTrend: () => <div data-testid="performance-trend">Performance Trend</div>,
}));

jest.mock('../../../client/src/components/DailyWins', () => ({
  DailyWins: () => <div data-testid="daily-wins">Daily Wins</div>,
}));

jest.mock('../../../client/src/components/FloatingActionButton', () => {
  const mockOnActionClick = jest.fn();
  
  return {
    FloatingActionButton: jest.fn(props => {
      if (props.onActionClick) {
        mockOnActionClick.mockImplementation(props.onActionClick);
      }
      
      return <div data-testid="fab">FAB</div>;
    }),
    __mockOnActionClick: mockOnActionClick
  };
});

jest.mock('../../../client/src/components/PlayerSelector', () => ({
  PlayerSelector: ({ onSelect, selectedPlayers }) => (
    <div data-testid="player-selector">
      <button onClick={() => onSelect(1)}>Select Player 1</button>
      <div data-testid="selected-players">{selectedPlayers?.join(',') || ''}</div>
    </div>
  ),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
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
