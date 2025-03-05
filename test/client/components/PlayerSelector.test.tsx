import React from 'react';
import { expect } from 'chai';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerSelector } from '../../../client/src/components/PlayerSelector';
import sinon from 'sinon';

// Mock player data for testing
const mockPlayers = [
  { id: 1, name: 'John', startYear: 2021, createdAt: new Date() },
  { id: 2, name: 'Sarah', startYear: 2022, createdAt: new Date() },
  { id: 3, name: 'Mike', startYear: 2023, createdAt: new Date() }
];

describe('<PlayerSelector />', () => {
  it('should render the list of players', () => {
    // Render the component with props
    render(
      <PlayerSelector 
        players={mockPlayers} 
        selectedPlayers={[]} 
        onSelect={() => {}} 
      />
    );
    
    // Assert that all player names are rendered
    expect(screen.getByText('John')).to.exist;
    expect(screen.getByText('Sarah')).to.exist;
    expect(screen.getByText('Mike')).to.exist;
  });
  
  it('should mark selected players as active', () => {
    // Render with selected players
    const { container } = render(
      <PlayerSelector 
        players={mockPlayers} 
        selectedPlayers={[2]} // Sarah is selected
        onSelect={() => {}} 
      />
    );
    
    // Find all player items
    const playerItems = container.querySelectorAll('[role="button"]');
    
    // Check that Sarah's button has the active class
    const sarahButton = Array.from(playerItems).find(
      item => item.textContent?.includes('Sarah')
    );
    
    // We can't directly test for CSS classes with testing-library
    // but we can check for attributes that would be added for selected state
    expect(sarahButton?.getAttribute('aria-pressed')).to.equal('true');
  });
  
  it('should call onSelect when a player is clicked', () => {
    // Create a spy for the onSelect callback
    const onSelectSpy = sinon.spy();
    
    // Render the component
    render(
      <PlayerSelector 
        players={mockPlayers} 
        selectedPlayers={[]} 
        onSelect={onSelectSpy} 
      />
    );
    
    // Find and click on John's button
    const johnButton = screen.getByText('John').closest('[role="button"]');
    if (johnButton) {
      fireEvent.click(johnButton);
    }
    
    // Assert that onSelect was called with the correct player ID
    expect(onSelectSpy.calledOnce).to.be.true;
    expect(onSelectSpy.calledWith(1)).to.be.true; // ID of John
  });
  
  it('should respect maxPlayers limit', () => {
    // Render with max 2 players and already 2 selected
    const { container } = render(
      <PlayerSelector 
        players={mockPlayers} 
        selectedPlayers={[1, 2]} // John and Sarah selected
        maxPlayers={2} 
        onSelect={() => {}} 
      />
    );
    
    // Find Mike's button
    const mikeButton = screen.getByText('Mike').closest('[role="button"]');
    
    // Verify that Mike's button is disabled
    expect(mikeButton?.getAttribute('aria-disabled')).to.equal('true');
  });
  
  it('should apply custom className when provided', () => {
    // Render with custom className
    const { container } = render(
      <PlayerSelector 
        players={mockPlayers} 
        selectedPlayers={[]} 
        onSelect={() => {}} 
        className="custom-selector-class" 
      />
    );
    
    // Find element with the custom class
    const element = container.querySelector('.custom-selector-class');
    
    // Assert that the element exists
    expect(element).to.exist;
  });
});