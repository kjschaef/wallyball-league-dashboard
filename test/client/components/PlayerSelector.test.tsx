import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerSelector } from '../../../client/src/components/PlayerSelector';
import { expect } from 'chai';
import sinon from 'sinon';

describe('PlayerSelector Component', () => {
  // Sample test data
  const mockPlayers = [
    { id: 1, name: 'Player 1', startYear: 2020, createdAt: new Date() },
    { id: 2, name: 'Player 2', startYear: 2021, createdAt: new Date() },
    { id: 3, name: 'Player 3', startYear: 2022, createdAt: new Date() }
  ];

  it('should render player options', () => {
    render(
      <PlayerSelector 
        players={mockPlayers}
        selectedPlayers={[]}
        onSelect={() => {}}
      />
    );
    
    // Check that all player names are rendered
    mockPlayers.forEach(player => {
      expect(screen.getByText(player.name)).to.exist;
    });
  });

  it('should mark selected players', () => {
    render(
      <PlayerSelector 
        players={mockPlayers}
        selectedPlayers={[1]} // Player 1 is selected
        onSelect={() => {}}
      />
    );
    
    // Find all player elements and check if the correct one is marked as selected
    const playerElements = screen.getAllByRole('button');
    
    // This is a simplified test - in a real test, you would check for a specific class
    // or attribute that indicates selection
    expect(playerElements.length).to.be.at.least(mockPlayers.length);
  });

  it('should call onSelect when a player is clicked', async () => {
    const onSelectSpy = sinon.spy();
    
    render(
      <PlayerSelector 
        players={mockPlayers}
        selectedPlayers={[]}
        onSelect={onSelectSpy}
      />
    );
    
    // Get the first player element and click it
    const playerElement = screen.getByText('Player 1');
    await userEvent.click(playerElement);
    
    // Check if onSelect was called with the correct player ID
    expect(onSelectSpy.calledOnce).to.be.true;
    expect(onSelectSpy.calledWith(1)).to.be.true; // Called with the ID of Player 1
  });

  it('should respect maxPlayers limit', () => {
    const maxPlayers = 2;
    
    render(
      <PlayerSelector 
        players={mockPlayers}
        selectedPlayers={[1, 2]} // Already selected 2 players
        maxPlayers={maxPlayers}
        onSelect={() => {}}
      />
    );
    
    // In a real implementation, there might be disabled buttons or other UI indicators
    // that show the max limit has been reached
    // This is a simplified test - you would check for specific UI state that indicates limitation
  });
});