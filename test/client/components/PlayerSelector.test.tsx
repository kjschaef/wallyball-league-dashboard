import React from 'react';
import { expect } from 'chai';
import { render, screen, fireEvent } from '@testing-library/react';
import sinon from 'sinon';
import type { SinonSandbox } from 'sinon';
import type { Player } from '../../../db/schema';

// Import the PlayerSelector component directly
import { PlayerSelector } from '../../../client/src/components/PlayerSelector';

// Mock utility functions
const cn = (...inputs: string[]) => inputs.filter(Boolean).join(' ');

// Define mock components used by PlayerSelector.tsx
const MockButton = ({ children, variant, className, onClick, disabled }: {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <button 
    onClick={onClick} 
    className={className}
    data-state={variant === 'default' ? 'on' : 'off'}
    disabled={disabled}
  >
    {children}
  </button>
);

const MockScrollArea = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="scroll-area">{children}</div>
);

// Mock player data
const mockPlayers: Player[] = [
  { id: 1, name: 'Player One', startYear: 2020, createdAt: new Date() },
  { id: 2, name: 'Player Two', startYear: 2021, createdAt: new Date() },
  { id: 3, name: 'Player Three', startYear: 2022, createdAt: new Date() }
];

describe('PlayerSelector Component', () => {
  let sandbox: SinonSandbox;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Set up mocks
    (global as any).Button = MockButton;
    (global as any).ScrollArea = MockScrollArea; 
    (global as any).cn = cn;
  });
  
  afterEach(() => {
    sandbox.restore();
    
    // Clean up global mocks
    delete (global as any).Button;
    delete (global as any).ScrollArea;
    delete (global as any).cn;
  });
  
  it('renders correctly with player list', () => {
    const handleSelectMock = () => {};
    
    render(
      <PlayerSelector 
        players={mockPlayers}
        selectedPlayers={[]}
        onSelect={handleSelectMock}
      />
    );
    
    // Check that all players are displayed
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
    
    // Third player should be disabled because max players is reached
    const playerThreeElement = playerElements[2];
    expect(playerThreeElement.hasAttribute('disabled')).to.be.true;
  });
});