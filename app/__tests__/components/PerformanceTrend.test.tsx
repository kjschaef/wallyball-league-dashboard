import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PerformanceTrend } from '../../components/PerformanceTrend';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn().mockReturnValue({
    data: [
      { id: 1, name: 'Player 1', matches: [{ date: '2025-04-01', won: true }], stats: { won: 10, lost: 5 } },
      { id: 2, name: 'Player 2', matches: [{ date: '2025-04-01', won: false }], stats: { won: 8, lost: 7 } },
    ],
    isLoading: false,
    error: null,
  }),
}));

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

jest.mock('date-fns', () => ({
  format: jest.fn().mockReturnValue('Jan 1'),
}));

jest.mock('../../lib/utils', () => ({
  calculatePenalizedWinPercentage: jest.fn().mockReturnValue(0.75),
  cn: jest.fn().mockImplementation((...args) => args.join(' ')),
}));

describe('PerformanceTrend', () => {
  test('renders performance trend chart', () => {
    render(<PerformanceTrend />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('line').length).toBe(2); // Two players in mock data
  });

  test('displays chart title', () => {
    render(<PerformanceTrend />);
    
    expect(screen.getByText('Performance Trends')).toBeInTheDocument();
  });

  test('displays player selection buttons', () => {
    render(<PerformanceTrend />);
    
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
  });
});
