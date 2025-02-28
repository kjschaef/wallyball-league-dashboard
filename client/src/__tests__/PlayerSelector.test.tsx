import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerSelector } from '../components/PlayerSelector';

// Mock data
const mockPlayers = [
  { id: 1, name: 'Alice', startYear: 2020, createdAt: new Date('2023-01-01') },
  { id: 2, name: 'Bob', startYear: 2021, createdAt: new Date('2023-01-02') },
  { id: 3, name: 'Charlie', startYear: 2022, createdAt: new Date('2023-01-03') },
];

describe('PlayerSelector', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders player list correctly', () => {
    render(
      <PlayerSelector
        players={mockPlayers}
        selectedPlayers={[]}
        onSelect={mockOnSelect}
      />
    );

    // Check if all players are rendered
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  test('shows selected state for selected players', () => {
    render(
      <PlayerSelector
        players={mockPlayers}
        selectedPlayers={[1]} // Alice is selected
        onSelect={mockOnSelect}
      />
    );

    // Find the selected player button for Alice
    // (Implementation might differ - adjust selector as needed)
    const aliceButton = screen.getByText('Alice').closest('button');
    expect(aliceButton).toHaveAttribute('aria-pressed', 'true');
    
    // Other players should not be selected
    const bobButton = screen.getByText('Bob').closest('button');
    expect(bobButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('calls onSelect when a player is clicked', () => {
    render(
      <PlayerSelector
        players={mockPlayers}
        selectedPlayers={[]}
        onSelect={mockOnSelect}
      />
    );

    // Click on a player
    fireEvent.click(screen.getByText('Bob'));
    
    // Check if onSelect was called with the correct player ID
    expect(mockOnSelect).toHaveBeenCalledWith(2);
  });

  test('respects maxPlayers limit', () => {
    render(
      <PlayerSelector
        players={mockPlayers}
        selectedPlayers={[1]} // Alice is already selected
        maxPlayers={1} // Only 1 player can be selected
        onSelect={mockOnSelect}
      />
    );

    // Try selecting another player
    fireEvent.click(screen.getByText('Bob'));
    
    // Since maxPlayers is 1 and we already have a selection,
    // onSelect should not have been called
    expect(mockOnSelect).not.toHaveBeenCalled();
  });
});