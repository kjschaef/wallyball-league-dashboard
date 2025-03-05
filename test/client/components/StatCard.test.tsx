import React from 'react';
import { expect } from 'chai';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../../../client/src/components/StatCard';

// Mock for lucide-react Trophy icon
const MockTrophy = (props: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>Trophy Icon</div>;
};

// Mock for the cn utility
const cn = (...inputs: string[]) => inputs.filter(Boolean).join(' ');

describe('StatCard Component', () => {
  // Setup mock environment
  before(() => {
    // Register mock implementations
    (global as any).lucideReact = { Trophy: MockTrophy };
    (global as any).cn = cn;
    
    // Set up global handlers for imports
    (global as any).Trophy = MockTrophy;
  });

  after(() => {
    // Clean up
    delete (global as any).lucideReact;
    delete (global as any).cn;
    delete (global as any).Trophy;
  });

  it('renders with title and value', () => {
    render(
      <StatCard 
        title="Win Rate" 
        value="75%" 
      />
    );
    
    expect(screen.getByText('Win Rate')).to.exist;
    expect(screen.getByText('75%')).to.exist;
  });
  
  it('renders with description when provided', () => {
    render(
      <StatCard 
        title="Games Played" 
        value={42} 
        description="Total games this season"
      />
    );
    
    expect(screen.getByText('Games Played')).to.exist;
    expect(screen.getByText('42')).to.exist;
    expect(screen.getByText('Total games this season')).to.exist;
  });
  
  it('renders with icon when provided', () => {
    render(
      <StatCard 
        title="Trophies" 
        value={5}
        icon={<MockTrophy data-testid="trophy-icon" />}
      />
    );
    
    expect(screen.getByText('Trophies')).to.exist;
    expect(screen.getByText('5')).to.exist;
    expect(screen.getByTestId('trophy-icon')).to.exist;
  });
  
  it('applies custom className when provided', () => {
    render(
      <StatCard 
        title="Points" 
        value={125}
        className="custom-class" 
      />
    );
    
    const cardElement = screen.getByText('Points').closest('div');
    expect(cardElement?.className).to.include('custom-class');
  });
  
  it('renders numbers and strings correctly', () => {
    const { rerender } = render(
      <StatCard 
        title="Number Value" 
        value={1000} 
      />
    );
    
    expect(screen.getByText('1000')).to.exist;
    
    rerender(
      <StatCard 
        title="String Value" 
        value="1,000" 
      />
    );
    
    expect(screen.getByText('1,000')).to.exist;
  });
});