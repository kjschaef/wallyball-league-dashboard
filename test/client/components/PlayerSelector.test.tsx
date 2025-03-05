import React from 'react';
import { expect } from 'chai';
import { render, screen, fireEvent } from '@testing-library/react';
import sinon from 'sinon';
import type { SinonSandbox } from 'sinon';
import type { Player } from '../../../db/schema';

// Import the PlayerSelector component directly with relative paths
import { PlayerSelector } from '../../../client/src/components/PlayerSelector';

// Set up mocks at the top level - the module-resolver will handle path aliases
const mockUtils = {
  cn: (...inputs: string[]) => inputs.filter(Boolean).join(' ')
};

const MockButton: React.FC<{
  children: React.ReactNode; 
  variant?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ children, variant, className, onClick, disabled }) => (
  <button 
    onClick={onClick} 
    className={className} 
    data-state={variant === 'default' ? 'on' : 'off'}
    disabled={disabled}
  >
    {children}
  </button>
);

const MockScrollArea: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => <div>{children}</div>;

// Mock data
const mockPlayers: Player[] = [
  { id: 1, name: 'Player One', startYear: 2020, createdAt: new Date() },
  { id: 2, name: 'Player Two', startYear: 2021, createdAt: new Date() },
  { id: 3, name: 'Player Three', startYear: 2022, createdAt: new Date() }
];

describe('PlayerSelector Component', () => {
  let sandbox: SinonSandbox;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Create global mocks for the module resolver
    (global as any).cn = mockUtils.cn;
    (global as any).Button = MockButton;
    (global as any).ScrollArea = MockScrollArea;
  });
  
  afterEach(() => {
    sandbox.restore();
  });
  
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
    let selectedPlayerId: number | null = null;
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
    
    // Check if the unselected player is disabled or has a className that indicates it's disabled
    const playerThreeElement = playerElements[2];
    const isDisabledByClass = playerThreeElement.className &&
                              playerThreeElement.className.includes('opacity-50') && 
                              playerThreeElement.className.includes('cursor-not-allowed');
    
    // Since we're using a mock Button component, we need to check the className instead of the disabled attribute
    expect(isDisabledByClass || playerThreeElement.hasAttribute('disabled')).to.be.true;
  });
});