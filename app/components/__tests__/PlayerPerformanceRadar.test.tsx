import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PlayerPerformanceRadar } from '../PlayerPerformanceRadar';

// Mock Recharts to avoid DOM/SVG issues in JSDOM
jest.mock('recharts', () => {
  return {
    Radar: () => <div data-testid="radar" />,
    RadarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="radar-chart">{children}</div>,
    PolarGrid: () => <div data-testid="polar-grid" />,
    PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
    PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
    Tooltip: () => <div data-testid="tooltip" />
  };
});

describe('PlayerPerformanceRadar', () => {
  let mathRandomSpy: jest.SpyInstance;

  beforeEach(() => {
    // Make Math.random deterministic so metrics that rely on it produce predictable results.
    mathRandomSpy = jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    mathRandomSpy.mockRestore();
  });

  it('renders loading state initially and then renders radar chart with metrics', async () => {
    // Render the component
    render(<PlayerPerformanceRadar />);

    // Wait for the async useEffect state update to settle
    await waitFor(() => {
      // Chart components should be rendered
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    expect(screen.getByTestId('radar-chart')).toBeInTheDocument();

    // Check for metric labels being rendered
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('Consistency')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('Versatility')).toBeInTheDocument();
    expect(screen.getByText('Clutch Factor')).toBeInTheDocument();

    // Consistency: player.matches.length > 10 ? 65 + Math.random() * 25
    // With mock random 0.5, 65 + 0.5 * 25 = 65 + 12.5 = 77.5. Math.round(77.5) = 78
    expect(screen.getByText('78/100')).toBeInTheDocument();

    // Win Rate: Troy has 14 won, 6 lost = (14/20) * 100 = 70
    // Versatility & Clutch Factor: 40 + Math.random() * 60
    // With mock random 0.5, 40 + 0.5 * 60 = 40 + 30 = 70. Math.round(70) = 70
    // Note: since multiple values evaluate to 70/100, we expect multiple matches.
    const seventies = screen.getAllByText('70/100');
    expect(seventies.length).toBeGreaterThanOrEqual(3); // Win Rate, Versatility, Clutch Factor

    // Experience: (20 / 117) * 100 = 17.09. Math.round(17.09) = 17
    expect(screen.getByText('17/100')).toBeInTheDocument();
  });
});
