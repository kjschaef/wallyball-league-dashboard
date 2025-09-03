import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SeasonSelector } from '@/app/components/SeasonSelector';

// Mock data
const mockSeasons = [
  {
    id: 3,
    name: '2025 Q3',
    start_date: '2025-07-01T04:00:00.000Z',
    end_date: '2025-10-01T03:59:59.000Z',
    is_active: true,
    created_at: '2025-09-02T04:06:57.483Z'
  },
  {
    id: 2,
    name: '2025 Q2',
    start_date: '2025-04-01T04:00:00.000Z',
    end_date: '2025-07-01T03:59:59.000Z',
    is_active: false,
    created_at: '2025-09-02T04:06:57.392Z'
  },
  {
    id: 1,
    name: '2025 Q1',
    start_date: '2025-01-01T05:00:00.000Z',
    end_date: '2025-04-01T03:59:59.000Z',
    is_active: false,
    created_at: '2025-09-02T04:06:57.296Z'
  }
];

describe('SeasonSelector', () => {
  const mockOnSeasonChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render current season toggle and lifetime options', () => {
    render(
      <SeasonSelector
        seasons={mockSeasons}
        currentSeason="current"
        onSeasonChange={mockOnSeasonChange}
      />
    );

    expect(screen.getByText('Current Season')).toBeInTheDocument();
    expect(screen.getByText('Lifetime Stats')).toBeInTheDocument();
  });

  it('should highlight current season when selected', () => {
    render(
      <SeasonSelector
        seasons={mockSeasons}
        currentSeason="current"
        onSeasonChange={mockOnSeasonChange}
      />
    );

    const currentSeasonButton = screen.getByText('Current Season');
    expect(currentSeasonButton).toHaveClass('bg-blue-600', 'text-white');
    
    const lifetimeButton = screen.getByText('Lifetime Stats');
    expect(lifetimeButton).toHaveClass('bg-gray-100', 'text-gray-700');
  });

  it('should highlight lifetime stats when selected', () => {
    render(
      <SeasonSelector
        seasons={mockSeasons}
        currentSeason="lifetime"
        onSeasonChange={mockOnSeasonChange}
      />
    );

    const currentSeasonButton = screen.getByText('Current Season');
    expect(currentSeasonButton).toHaveClass('bg-gray-100', 'text-gray-700');
    
    const lifetimeButton = screen.getByText('Lifetime Stats');
    expect(lifetimeButton).toHaveClass('bg-blue-600', 'text-white');
  });

  it('should call onSeasonChange when current season is clicked', () => {
    render(
      <SeasonSelector
        seasons={mockSeasons}
        currentSeason="lifetime"
        onSeasonChange={mockOnSeasonChange}
      />
    );

    fireEvent.click(screen.getByText('Current Season'));
    expect(mockOnSeasonChange).toHaveBeenCalledWith('current');
  });

  it('should call onSeasonChange when lifetime stats is clicked', () => {
    render(
      <SeasonSelector
        seasons={mockSeasons}
        currentSeason="current"
        onSeasonChange={mockOnSeasonChange}
      />
    );

    fireEvent.click(screen.getByText('Lifetime Stats'));
    expect(mockOnSeasonChange).toHaveBeenCalledWith('lifetime');
  });

  it('should show dropdown for historical seasons', () => {
    render(
      <SeasonSelector
        seasons={mockSeasons}
        currentSeason="current"
        onSeasonChange={mockOnSeasonChange}
      />
    );

    const dropdown = screen.getByRole('combobox');
    expect(dropdown).toBeInTheDocument();
  });

  it('should populate dropdown with historical seasons', () => {
    render(
      <SeasonSelector
        seasons={mockSeasons}
        currentSeason="current"
        onSeasonChange={mockOnSeasonChange}
      />
    );

    const dropdown = screen.getByRole('combobox');
    fireEvent.click(dropdown);

    expect(screen.getByText('2025 Q2')).toBeInTheDocument();
    expect(screen.getByText('2025 Q1')).toBeInTheDocument();
  });

  it('should call onSeasonChange when historical season is selected', () => {
    render(
      <SeasonSelector
        seasons={mockSeasons}
        currentSeason="current"
        onSeasonChange={mockOnSeasonChange}
      />
    );

    const dropdown = screen.getByRole('combobox');
    fireEvent.change(dropdown, { target: { value: '2' } });

    expect(mockOnSeasonChange).toHaveBeenCalledWith('2');
  });

  it('should show active season label correctly', () => {
    render(
      <SeasonSelector
        seasons={mockSeasons}
        currentSeason="current"
        onSeasonChange={mockOnSeasonChange}
      />
    );

    // Should show "2025 Q3" as current season label
    expect(screen.getByText('2025 Q3')).toBeInTheDocument();
  });

  it('should handle empty seasons list', () => {
    render(
      <SeasonSelector
        seasons={[]}
        currentSeason="lifetime"
        onSeasonChange={mockOnSeasonChange}
      />
    );

    expect(screen.getByText('Current Season')).toBeInTheDocument();
    expect(screen.getByText('Lifetime Stats')).toBeInTheDocument();
    
    const dropdown = screen.queryByRole('combobox');
    expect(dropdown).not.toBeInTheDocument();
  });

  it('should show specific season name when selected by ID', () => {
    render(
      <SeasonSelector
        seasons={mockSeasons}
        currentSeason="1"
        onSeasonChange={mockOnSeasonChange}
      />
    );

    // Should show "2025 Q1" when season ID 1 is selected
    expect(screen.getByText('2025 Q1')).toBeInTheDocument();
  });
});