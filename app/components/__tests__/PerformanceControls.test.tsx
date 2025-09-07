import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PerformanceControls } from '../PerformanceControls';

// Mock react-select to a simple input for testability
jest.mock('react-select', () => (props: any) => {
  const React = require('react');
  return React.createElement('input', {
    'data-testid': 'react-select',
    onChange: (e: any) => {
      const val = e.target.value;
      const parts = val.split(',').map((v: string) => ({ value: Number(v), label: v }));
      props.onChange(parts);
    }
  });
});

describe('PerformanceControls', () => {
  const seasons = [{ id: 1, name: 'S1', is_active: true, start_date: '', end_date: '' }, { id: 2, name: 'S2', is_active: false, start_date: '', end_date: '' }];
  const players = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];

  beforeEach(() => {
    // mock fetch for seasons and players
    global.fetch = jest.fn((url: RequestInfo) => {
      if ((url as string).includes('/api/seasons')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(seasons) } as any);
      }
      if ((url as string).includes('/api/players')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(players) } as any);
      }
      return Promise.resolve({ ok: false } as any);
    }) as any;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders and responds to controls', async () => {
    const onChange = jest.fn();
    render(React.createElement(PerformanceControls, { season: 'current', metric: 'winPercentage', compare: [], onChange }));

    // Wait for fetch effects
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    // Wait for season option to render
    await screen.findByText('S2');

    // Metric toggle
    const totalWinsBtn = screen.getByText('Total Wins');
    fireEvent.click(totalWinsBtn);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ metric: 'totalWins' }));

    // Season select
    const seasonSelect = screen.getByLabelText('Season') as HTMLSelectElement;
    fireEvent.change(seasonSelect, { target: { value: '2' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ season: '2' }));

    // Compare select (mocked react-select)
    const rs = screen.getByTestId('react-select') as HTMLInputElement;
    fireEvent.change(rs, { target: { value: '2' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ compare: [2] }));

    // Reset and Export
    const resetBtn = screen.getByText('Reset');
    fireEvent.click(resetBtn);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'reset' }));

    const exportBtn = screen.getByText('Export');
    fireEvent.click(exportBtn);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'export' }));
  });
});
