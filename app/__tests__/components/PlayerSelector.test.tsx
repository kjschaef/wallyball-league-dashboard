import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PlayerSelector } from '../../components/PlayerSelector';

type MockPlayer = {
  id: number;
  name: string;
  startYear: number | null;
  createdAt: Date | null;
};

describe('PlayerSelector', () => {
  const mockPlayers: MockPlayer[] = [
    { id: 1, name: 'Player 1', startYear: 2020, createdAt: new Date('2020-01-01T00:00:00Z') },
    { id: 2, name: 'Player 2', startYear: 2021, createdAt: new Date('2021-01-01T00:00:00Z') },
    { id: 3, name: 'Player 3', startYear: 2022, createdAt: new Date('2022-01-01T00:00:00Z') },
  ];

  test('renders player list correctly', () => {
    render(
      <PlayerSelector 
        players={mockPlayers}
        selectedPlayers={[]}
        onSelect={jest.fn()}
      />
    );
    
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
    expect(screen.getByText('Player 3')).toBeInTheDocument();
  });

  test('displays selected players with active state', () => {
    render(
      <PlayerSelector 
        players={mockPlayers}
        selectedPlayers={[1]}
        onSelect={jest.fn()}
      />
    );
    
    const playerElements = screen.getAllByRole('button');
    
    expect(playerElements[0]).toHaveClass('bg-primary');
    
    expect(playerElements[1]).not.toHaveClass('bg-primary');
    expect(playerElements[2]).not.toHaveClass('bg-primary');
  });

  test('calls onSelect when a player is clicked', () => {
    const onSelectMock = jest.fn();
    
    render(
      <PlayerSelector 
        players={mockPlayers}
        selectedPlayers={[]}
        onSelect={onSelectMock}
      />
    );
    
    const playerElements = screen.getAllByRole('button');
    fireEvent.click(playerElements[1]); // Click Player 2
    
    expect(onSelectMock).toHaveBeenCalledWith(2);
  });
});
