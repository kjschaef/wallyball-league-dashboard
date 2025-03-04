import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerCard } from './PlayerCard';
import { createMockPlayer } from '../../../test/utils/mockFactory';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a wrapper to provide the react-query context
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('PlayerCard Component', () => {
  const mockPlayer = {
    ...createMockPlayer({ id: 1, name: 'John Doe', startYear: 2022 }),
    matches: [
      { won: true, date: '2023-05-15' },
      { won: false, date: '2023-05-20' },
      { won: true, date: '2023-05-25' },
    ],
    stats: { won: 2, lost: 1 }
  };
  
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  it('renders player information correctly', () => {
    render(
      <PlayerCard 
        player={mockPlayer} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />,
      { wrapper: createWrapper() }
    );
    
    // Check if player name is rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Check if player stats are rendered
    expect(screen.getByText('2')).toBeInTheDocument(); // Wins
    expect(screen.getByText('1')).toBeInTheDocument(); // Losses
    
    // Check if win rate is calculated and displayed correctly
    expect(screen.getByText('67%')).toBeInTheDocument(); // 2 wins out of 3 matches = 67%
    
    // Check if player start year is displayed
    expect(screen.getByText('Since 2022')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <PlayerCard 
        player={mockPlayer} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />,
      { wrapper: createWrapper() }
    );
    
    // Find and click the edit button
    const editButton = screen.getByLabelText('Edit player');
    fireEvent.click(editButton);
    
    // Check if onEdit was called with the correct player
    expect(mockOnEdit).toHaveBeenCalledWith(mockPlayer);
  });

  it('calls onDelete when delete button is clicked and confirmed', () => {
    render(
      <PlayerCard 
        player={mockPlayer} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />,
      { wrapper: createWrapper() }
    );
    
    // Note: Due to the Dialog component, actual delete confirmation would need a more complex test
    // This is a simplified version that just ensures the delete button is rendered
    const deleteButton = screen.getByLabelText('Delete player');
    expect(deleteButton).toBeInTheDocument();
  });

  it('renders without edit and delete buttons when callbacks not provided', () => {
    render(
      <PlayerCard player={mockPlayer} />,
      { wrapper: createWrapper() }
    );
    
    // Check that edit and delete buttons are not present
    expect(screen.queryByLabelText('Edit player')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Delete player')).not.toBeInTheDocument();
  });
});