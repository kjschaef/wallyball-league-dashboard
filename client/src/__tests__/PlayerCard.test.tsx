import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerCard } from '../components/PlayerCard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a test QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock the onEdit and onDelete functions
const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();
const mockMutate = jest.fn();

// Mock react-query's useMutation
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useMutation: () => ({
    mutate: mockMutate,
    isLoading: false,
  }),
}));

// Sample player data for testing
const samplePlayer = {
  id: 1,
  name: 'Alice Smith',
  startYear: 2021,
  createdAt: new Date('2023-01-01'),
  matches: [
    { won: true, date: '2023-05-01' },
    { won: false, date: '2023-05-15' },
    { won: true, date: '2023-06-01' },
  ],
  stats: { won: 2, lost: 1 }
};

// Wrapper component with QueryClient provider
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('PlayerCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders player name and stats correctly', () => {
    render(
      <PlayerCard
        player={samplePlayer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: Wrapper }
    );

    // Check if the player name is displayed
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    
    // Check if stats are displayed
    expect(screen.getByText('2')).toBeInTheDocument(); // Wins
    expect(screen.getByText('1')).toBeInTheDocument(); // Losses
  });

  test('calls onEdit when edit button is clicked', () => {
    render(
      <PlayerCard
        player={samplePlayer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: Wrapper }
    );

    // Find and click the edit button
    const editButton = screen.getByLabelText(/edit/i);
    fireEvent.click(editButton);
    
    // Check if onEdit was called with the player
    expect(mockOnEdit).toHaveBeenCalledWith(samplePlayer);
  });

  test('calls onDelete when delete button is clicked and confirmed', () => {
    render(
      <PlayerCard
        player={samplePlayer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: Wrapper }
    );

    // Find and click the delete button
    const deleteButton = screen.getByLabelText(/delete/i);
    fireEvent.click(deleteButton);
    
    // Find and click the confirm button in the dialog
    const confirmButton = screen.getByText(/delete/i, { selector: 'button' });
    fireEvent.click(confirmButton);
    
    // Check if onDelete was called with the player ID
    expect(mockOnDelete).toHaveBeenCalledWith(samplePlayer.id);
  });

  test('shows win-loss ratio correctly', () => {
    render(
      <PlayerCard
        player={samplePlayer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: Wrapper }
    );
    
    // Check for win percentage (2 wins out of 3 games = 67%)
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  test('renders recent match history', () => {
    render(
      <PlayerCard
        player={samplePlayer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: Wrapper }
    );
    
    // Check if recent matches section is displayed
    expect(screen.getByText(/recent matches/i)).toBeInTheDocument();
    
    // We should see the match dates
    expect(screen.getByText('Jun 1')).toBeInTheDocument();
    expect(screen.getByText('May 15')).toBeInTheDocument();
    expect(screen.getByText('May 1')).toBeInTheDocument();
  });
});