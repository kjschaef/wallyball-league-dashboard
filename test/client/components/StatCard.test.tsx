import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../../../client/src/components/StatCard';
import { expect } from 'chai';

describe('StatCard Component', () => {
  it('should render with title and value', () => {
    render(<StatCard title="Test Title" value="42" />);
    
    // Verify the title and value are displayed
    expect(screen.getByText('Test Title')).to.exist;
    expect(screen.getByText('42')).to.exist;
  });

  it('should render with description when provided', () => {
    const description = 'This is a test description';
    render(<StatCard title="Test" value="10" description={description} />);
    
    expect(screen.getByText(description)).to.exist;
  });

  it('should apply custom className when provided', () => {
    const customClass = 'custom-test-class';
    const { container } = render(
      <StatCard title="Test" value="10" className={customClass} />
    );
    
    // Find the main container element and check for the class
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement.className).to.include(customClass);
  });
});