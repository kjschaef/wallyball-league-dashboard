import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SeasonStatistics } from '../../src/components/SeasonStatistics';

describe('SeasonStatistics', () => {
  const mockStats = {
    totalMatches: 142,
    totalGames: 330,
    avgGamesPerMatch: 2.3
  };

  it('renders season statistics with correct values', () => {
    render(<SeasonStatistics stats={mockStats} />);
    
    expect(screen.getByText('Season Statistics')).toBeInTheDocument();
    expect(screen.getByText('Total Matches')).toBeInTheDocument();
    expect(screen.getByText('142')).toBeInTheDocument();
    expect(screen.getByText('Total Games')).toBeInTheDocument();
    expect(screen.getByText('330')).toBeInTheDocument();
    expect(screen.getByText('Avg Games per Match')).toBeInTheDocument();
    expect(screen.getByText('2.3')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(<SeasonStatistics stats={null} />);
    
    expect(screen.getByText('Season Statistics')).toBeInTheDocument();
    // Should show loading placeholders or skeleton
    expect(screen.getByTestId('loading-stats')).toBeInTheDocument();
  });

  it('displays formatted numbers correctly', () => {
    const largeStats = {
      totalMatches: 1234,
      totalGames: 5678,
      avgGamesPerMatch: 4.6
    };
    
    render(<SeasonStatistics stats={largeStats} />);
    
    expect(screen.getByText('1234')).toBeInTheDocument();
    expect(screen.getByText('5678')).toBeInTheDocument();
    expect(screen.getByText('4.6')).toBeInTheDocument();
  });
});