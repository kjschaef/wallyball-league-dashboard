import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../../../client/src/components/StatCard';
import '../../../test/jsdom-setup.js';

describe('StatCard Component', () => {
  before(() => {
    // Ensure JSDOM is properly setup before running React component tests
    if (!global.window) {
      throw new Error('JSDOM environment not properly set up');
    }
  });

  it('renders title and value correctly', () => {
    // Arrange
    const title = 'Win Rate';
    const value = '75%';
    
    // Act
    render(<StatCard title={title} value={value} />);
    
    // Assert
    expect(screen.getByText(title)).to.exist;
    expect(screen.getByText(value)).to.exist;
  });

  it('renders description when provided', () => {
    // Arrange
    const title = 'Total Games';
    const value = '42';
    const description = 'Games played this season';
    
    // Act
    render(<StatCard title={title} value={value} description={description} />);
    
    // Assert
    expect(screen.getByText(description)).to.exist;
  });

  it('applies custom className when provided', () => {
    // Arrange
    const title = 'Achievements';
    const value = '10';
    const customClass = 'custom-stat-card';
    
    // Act
    const { container } = render(
      <StatCard title={title} value={value} className={customClass} />
    );
    
    // Assert - check if the class is applied to the main container
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement.className).to.include(customClass);
  });
});