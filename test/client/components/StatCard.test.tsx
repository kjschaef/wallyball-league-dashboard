import React from 'react';
import { expect } from 'chai';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../../../client/src/components/StatCard';

describe('<StatCard />', () => {
  it('should render the title and value correctly', () => {
    // Render the component with props
    render(<StatCard title="Wins" value="42" description="Total wins this season" />);
    
    // Assert that the title is rendered
    expect(screen.getByText('Wins')).to.exist;
    
    // Assert that the value is rendered
    expect(screen.getByText('42')).to.exist;
    
    // Assert that the description is rendered
    expect(screen.getByText('Total wins this season')).to.exist;
  });
  
  it('should render with custom className', () => {
    // Render with custom class name
    const { container } = render(
      <StatCard 
        title="Win Rate" 
        value="75%" 
        className="custom-class" 
      />
    );
    
    // Find the element with the custom class
    const cardElement = container.querySelector('.custom-class');
    
    // Assert that the element exists
    expect(cardElement).to.exist;
  });
  
  it('should render with an icon when provided', () => {
    // Render with an icon
    render(
      <StatCard 
        title="Score" 
        value="100" 
        icon={<div data-testid="test-icon">🏆</div>} 
      />
    );
    
    // Assert that the icon is rendered
    expect(screen.getByTestId('test-icon')).to.exist;
  });
  
  it('should work with numeric values', () => {
    // Render with numeric value
    render(<StatCard title="Points" value={123} />);
    
    // Assert that the numeric value is rendered
    expect(screen.getByText('123')).to.exist;
  });
});