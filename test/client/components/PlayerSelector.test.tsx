import React from 'react';
import { expect } from 'chai';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerSelector } from '../../../client/src/components/PlayerSelector';

// Mock data
const mockPlayers = [
  { id: 1, name: 'Player One', startYear: 2020, createdAt: new Date() },
  { id: 2, name: 'Player Two', startYear: 2021, createdAt: new Date() },
  { id: 3, name: 'Player Three', startYear: 2022, createdAt: new Date() }
];

describe('PlayerSelector Component', () => {
  it('renders correctly with player list', () => {
    // Setup mock callback
    const handleSelectMock = () => {};
    
    // Render component with mock data
    render(
      <PlayerSelector 
        players={mockPlayers}
        selectedPlayers={[]}
        onSelect={handleSelectMock}
      />
    );
    
    // Assert that all players are displayed
    expect(screen.getByText('Player One')).to.exist;
    expect(screen.getByText('Player Two')).to.exist;
    expect(screen.getByText('Player Three')).to.exist;
  });
  
  it('highlights selected players', () => {
    const handleSelectMock = () => {};
    
    render(
      <PlayerSelector 
        players={mockPlayers}
        selectedPlayers={[1]} // Player One is selected
        onSelect={handleSelectMock}
      />
    );
    
    // Get all player elements
    const playerElements = screen.getAllByRole('button');
    
    // First player should have a selected class or attribute
    expect(playerElements[0].getAttribute('data-state')).to.equal('on');
    
    // Other players should not be selected
    expect(playerElements[1].getAttribute('data-state')).to.equal('off');
    expect(playerElements[2].getAttribute('data-state')).to.equal('off');
  });
  
  it('calls onSelect when a player is clicked', () => {
    // Setup mock callback with tracking
    let selectedPlayerId = null;
    const handleSelectMock = (id: number) => {
      selectedPlayerId = id;
    };
    
    render(
      <PlayerSelector 
        players={mockPlayers}
        selectedPlayers={[]}
        onSelect={handleSelectMock}
      />
    );
    
    // Click on a player
    const playerElements = screen.getAllByRole('button');
    fireEvent.click(playerElements[1]); // Click on Player Two
    
    // Verify callback was called with correct player ID
    expect(selectedPlayerId).to.equal(2);
  });
  
  it('respects maxPlayers limit', () => {
    const handleSelectMock = () => {};
    
    render(
      <PlayerSelector 
        players={mockPlayers}
        selectedPlayers={[1, 2]} // Two players already selected
        maxPlayers={2} // Maximum of 2 players
        onSelect={handleSelectMock}
      />
    );
    
    // All player elements should exist
    const playerElements = screen.getAllByRole('button');
    expect(playerElements.length).to.equal(3);
    
    // But the unselected player should be disabled
    expect(playerElements[2].hasAttribute('disabled')).to.be.true;
  });
});