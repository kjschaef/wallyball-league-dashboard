import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PerformanceTrend } from '../PerformanceTrend';

jest.mock('../PerformanceControls', () => ({
  PerformanceControls: () => <div data-testid="performance-controls" />,
}));

jest.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    LineChart: ({ children, data, onMouseDown, onMouseMove, onMouseUp }: any) => (
      <button
        type="button"
        data-testid="line-chart"
        data-points={data.length}
        onMouseDown={() => onMouseDown?.({ activeLabel: '2026-01-01' })}
        onMouseMove={() => onMouseMove?.({ activeLabel: '2026-01-03' })}
        onMouseUp={() => onMouseUp?.()}
      >
        {children}
      </button>
    ),
    Line: ({ dataKey, isAnimationActive }: any) => (
      <div
        data-testid={`line-${dataKey}`}
        data-animation-active={String(isAnimationActive)}
      />
    ),
    XAxis: () => null,
    YAxis: ({ domain }: any) => <div data-testid="y-axis" data-domain={JSON.stringify(domain)} />,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    ReferenceArea: () => <div data-testid="reference-area" />,
  };
});

describe('PerformanceTrend', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url: RequestInfo) => {
      if ((url as string).includes('/api/player-stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 1,
              name: 'Alice',
              record: {
                wins: 3,
                losses: 1,
                totalGames: 4,
              },
              winPercentage: 75,
            },
          ]),
        } as any);
      }

      if ((url as string).includes('/api/player-trends')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              name: 'Alice',
              dailyStats: {
                '2026-01-01': { winPercentage: 50, totalWins: 1, totalGames: 2 },
                '2026-01-02': { winPercentage: 60, totalWins: 2, totalGames: 3 },
                '2026-01-03': { winPercentage: 66.7, totalWins: 2, totalGames: 3 },
                '2026-01-04': { winPercentage: 75, totalWins: 3, totalGames: 4 },
              },
            },
          ]),
        } as any);
      }

      return Promise.resolve({ ok: false } as any);
    }) as any;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('zooms to a dragged date range and resets back to the full chart', async () => {
    render(<PerformanceTrend season="lifetime" />);

    const chart = await screen.findByTestId('line-chart');
    const yAxis = await screen.findByTestId('y-axis');
    const line = await screen.findByTestId('line-Alice');

    await waitFor(() => {
      expect(chart.getAttribute('data-points')).toBe('4');
      expect(yAxis.getAttribute('data-domain')).toBe('[47.5,77.5]');
      expect(line.getAttribute('data-animation-active')).toBe('true');
    });

    fireEvent.mouseDown(chart);

    await waitFor(() => {
      expect(line.getAttribute('data-animation-active')).toBe('false');
    });

    fireEvent.mouseMove(chart);
    fireEvent.mouseUp(chart);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Reset zoom' })).not.toBeNull();
      expect(chart.getAttribute('data-points')).toBe('3');
      expect(yAxis.getAttribute('data-domain')).toBe('[48,68.7]');
      expect(line.getAttribute('data-animation-active')).toBe('true');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reset zoom' }));

    await waitFor(() => {
      expect(chart.getAttribute('data-points')).toBe('4');
      expect(yAxis.getAttribute('data-domain')).toBe('[47.5,77.5]');
    });
  });
});
