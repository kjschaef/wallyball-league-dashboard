import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BestPerformingTeams } from '../../src/components/BestPerformingTeams';

describe('BestPerformingTeams', () => {
  const mockTeams = [
    {
      id: 1,
      players: ['Hodnett', 'Parker'],
      wins: 19,
      losses: 2,
      winPercentage: 90.5,
      totalGames: 21
    },
    {
      id: 2,
      players: ['Keith', 'Nate', 'Reily'],
      wins: 5,
      losses: 1,
      winPercentage: 83.3,
      totalGames: 6
    },
    {
      id: 3,
      players: ['Hodnett', 'Lance'],
      wins: 30,
      losses: 12,
      winPercentage: 71.4,
      totalGames: 42
    }
  ];

  it('renders best performing teams section', () => {
    render(<BestPerformingTeams teams={mockTeams} minGames={6} />);
    
    expect(screen.getByText('Best Performing Teams (Min. 6 Games)')).toBeInTheDocument();
  });

  it('displays team combinations with correct format', () => {
    render(<BestPerformingTeams teams={mockTeams} minGames={6} />);
    
    expect(screen.getByText('Hodnett and Parker')).toBeInTheDocument();
    expect(screen.getByText('Keith, Nate and Reily')).toBeInTheDocument();
    expect(screen.getByText('Hodnett and Lance')).toBeInTheDocument();
  });

  it('shows win-loss records and percentages', () => {
    render(<BestPerformingTeams teams={mockTeams} minGames={6} />);
    
    expect(screen.getByText('19W - 2L')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('5W - 1L')).toBeInTheDocument();
    expect(screen.getByText('83%')).toBeInTheDocument();
    expect(screen.getByText('30W - 12L')).toBeInTheDocument();
    expect(screen.getByText('71%')).toBeInTheDocument();
  });

  it('filters teams by minimum games', () => {
    const teamsWithLowGames = [
      ...mockTeams,
      {
        id: 4,
        players: ['Player1', 'Player2'],
        wins: 2,
        losses: 1,
        winPercentage: 66.7,
        totalGames: 3
      }
    ];

    render(<BestPerformingTeams teams={teamsWithLowGames} minGames={6} />);
    
    // Should not show the team with only 3 games
    expect(screen.queryByText('Player1 and Player2')).not.toBeInTheDocument();
    // Should show teams with 6+ games
    expect(screen.getByText('Hodnett and Parker')).toBeInTheDocument();
  });

  it('sorts teams by win percentage descending', () => {
    render(<BestPerformingTeams teams={mockTeams} minGames={6} />);
    
    const teamElements = screen.getAllByTestId('team-row');
    expect(teamElements[0]).toHaveTextContent('Hodnett and Parker');
    expect(teamElements[1]).toHaveTextContent('Keith, Nate and Reily');
    expect(teamElements[2]).toHaveTextContent('Hodnett and Lance');
  });

  it('handles loading state', () => {
    render(<BestPerformingTeams teams={null} minGames={6} />);
    
    expect(screen.getByText('Best Performing Teams (Min. 6 Games)')).toBeInTheDocument();
    expect(screen.getByTestId('loading-teams')).toBeInTheDocument();
  });

  it('handles empty teams list', () => {
    render(<BestPerformingTeams teams={[]} minGames={6} />);
    
    expect(screen.getByText('Best Performing Teams (Min. 6 Games)')).toBeInTheDocument();
    expect(screen.getByText('No teams meet the minimum games requirement')).toBeInTheDocument();
  });
});