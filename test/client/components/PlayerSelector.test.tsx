import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerSelector } from '../../../client/src/components/PlayerSelector';
import { Player } from '../../../db/schema';
import '../../../test/jsdom-setup.js';

describe('PlayerSelector Component', () => {
  // Mock player data for testing
  const mockPlayers: Player[] = [
    { id: 1, name: 'John Doe', startYear: 2020, createdAt: new Date() },
    { id: 2, name: 'Jane Smith', startYear: 2021, createdAt: new Date() },
    { id: 3, name: 'Bob Johnson', startYear: 2022, createdAt: new Date() }
  ];

  before(() => {
    // Ensure JSDOM is properly setup before running React component tests
    if (!global.window) {
      throw new Error('JSDOM environment not properly set up');
    }
  });

  it('renders all players correctly', () => {
    // Arrange
    const onSelect = () => {};
    
    // Act
    render(
      <PlayerSelector 
        players={mockPlayers} 
        selectedPlayers={[]} 
        onSelect={onSelect} 
      />
    );
    
    // Assert - check if all player names are rendered
    expect(screen.getByText('John Doe')).to.exist;
    expect(screen.getByText('Jane Smith')).to.exist;
    expect(screen.getByText('Bob Johnson')).to.exist;
  });

  it('shows selected players as active', () => {
    // Arrange
    const onSelect = () => {};
    const selectedPlayerIds = [1, 3]; // John and Bob are selected
    
    // Act
    const { container } = render(
      <PlayerSelector 
        players={mockPlayers} 
        selectedPlayers={selectedPlayerIds} 
        onSelect={onSelect} 
      />
    );
    
    // Assert - check if selected players have the correct styling
    // This is a simplified test that assumes selected players have a different class
    const playerElements = container.querySelectorAll('button');
    expect(playerElements.length).to.equal(3);
    
    // Check for selected class on buttons (implementation details might vary)
    const selectedElements = container.querySelectorAll('button.selected');
    expect(selectedElements.length).to.equal(2);
  });

  it('calls onSelect with player id when clicked', () => {
    // Arrange
    let selectedPlayerId: number | null = null;
    const onSelect = (id: number) => { selectedPlayerId = id; };
    
    // Act
    render(
      <PlayerSelector 
        players={mockPlayers} 
        selectedPlayers={[]} 
        onSelect={onSelect} 
      />
    );
    
    // Find and click the second player (Jane Smith, id: 2)
    const playerButtons = screen.getAllByRole('button');
    fireEvent.click(playerButtons[1]);
    
    // Assert
    expect(selectedPlayerId).to.equal(2);
  });

  it('respects maxPlayers limit', () => {
    // Arrange
    const onSelect = () => {};
    
    // Act
    render(
      <PlayerSelector 
        players={mockPlayers} 
        selectedPlayers={[1]} // One player already selected
        maxPlayers={1} // Maximum one player
        onSelect={onSelect} 
      />
    );
    
    // Assert - the component should indicate max players reached
    // This depends on implementation details - might check for disabled buttons
    // or a specific message
    const playerButtons = screen.getAllByRole('button');
    
    // Assuming non-selected buttons would be disabled when max is reached
    // Check if Jane and Bob's buttons are disabled
    expect(playerButtons[1].hasAttribute('disabled')).to.be.true;
    expect(playerButtons[2].hasAttribute('disabled')).to.be.true;
  });
});