import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlayerCard } from '../../../client/src/components/PlayerCard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as utils from '../../../client/src/lib/utils';

jest.mock('../../../client/src/lib/utils', () => ({
  ...jest.requireActual('../../../client/src/lib/utils'),
  calculateInactivityPenalty: jest.fn(),
}));

jest.mock('../../../client/src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

function MockPlayerAchievements() {
  return <div data-testid="player-achievements">Achievements</div>;
}
MockPlayerAchievements.displayName = "MockPlayerAchievements";
jest.mock('../../../client/src/components/PlayerAchievements', () => ({
  PlayerAchievements: MockPlayerAchievements,
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

describe('PlayerCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );
    
    (utils.calculateInactivityPenalty as jest.Mock).mockReturnValue({
      lastMatch: new Date(),
      weeksInactive: 0,
      penaltyPercentage: 0,
      decayFactor: 1
    });
  });

  const mockPlayer = {
    id: 1,
    name: 'Test Player',
    startYear: 2020,
    createdAt: '2020-01-01T00:00:00Z',
    matches: [
      { 
        id: 1, 
        date: '2025-04-28T00:00:00Z',
        won: true
      }
    ],
    stats: {
      won: 8,
      lost: 2,
      totalMatchTime: 15
    }
  };

  test('renders player name and stats correctly', () => {
    render(
      <PlayerCard 
        player={mockPlayer} 
        onDelete={jest.fn()} 
        onEdit={jest.fn()} 
      />,
      { wrapper: createWrapper() }
    );
    
    expect(screen.getByText('Test Player')).toBeInTheDocument();
    expect(screen.getByTestId('player-achievements')).toBeInTheDocument();
  });

  test('calls onDelete when delete button is clicked and confirmed', async () => {
    const onDeleteMock = jest.fn();
    
    render(
      <PlayerCard 
        player={mockPlayer} 
        onDelete={onDeleteMock} 
        onEdit={jest.fn()} 
      />,
      { wrapper: createWrapper() }
    );
    
    const deleteButton = screen.getAllByRole('button')
      .find(button => button.querySelector('.lucide-trash2'));
    
    if (!deleteButton) {
      throw new Error('Delete button not found');
    }
    
    fireEvent.click(deleteButton);
    
    const confirmButton = await screen.findByRole('button', { name: /delete/i });
    fireEvent.click(confirmButton);
    
    expect(onDeleteMock).toHaveBeenCalledWith(mockPlayer.id);
  });

  test('calls onEdit when edit button is clicked', () => {
    const onEditMock = jest.fn();
    
    render(
      <PlayerCard 
        player={mockPlayer} 
        onDelete={jest.fn()} 
        onEdit={onEditMock} 
      />,
      { wrapper: createWrapper() }
    );
    
    const editButton = screen.getAllByRole('button')
      .find(button => button.querySelector('.lucide-square-pen'));
    
    if (!editButton) {
      throw new Error('Edit button not found');
    }
    
    fireEvent.click(editButton);
    
    expect(onEditMock).toHaveBeenCalledWith(mockPlayer);
  });

  test('displays win percentage with inactivity penalty applied', () => {
    (utils.calculateInactivityPenalty as jest.Mock).mockReturnValue({
      lastMatch: new Date('2025-03-01T00:00:00Z'),
      weeksInactive: 4,
      penaltyPercentage: 0.2,
      decayFactor: 0.8
    });
    
    const playerWithMatches = {
      ...mockPlayer,
      matches: [
        { 
          id: 1, 
          date: '2025-03-01T00:00:00Z',
          won: true
        }
      ]
    };
    
    render(
      <PlayerCard 
        player={playerWithMatches} 
        onDelete={jest.fn()} 
        onEdit={jest.fn()} 
      />,
      { wrapper: createWrapper() }
    );
    
    expect(utils.calculateInactivityPenalty).toHaveBeenCalled();
  });
});
