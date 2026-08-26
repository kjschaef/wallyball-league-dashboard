import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecordMatchModal } from '@/app/components/RecordMatchModal';

describe('RecordMatchModal', () => {
  const mockSubmit = jest.fn().mockResolvedValue(true);
  const mockClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation((url: RequestInfo) => {
      const requestUrl = String(url);
      if (requestUrl === '/api/players') {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, name: 'Active Alice', lastGameDate: new Date().toISOString() },
            { id: 2, name: 'Active Bob', lastGameDate: new Date().toISOString() },
            { id: 3, name: 'Inactive Charlie', lastGameDate: '2024-01-01T00:00:00.000Z' },
          ],
        } as Response);
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) } as Response);
    });
  });

  it('renders active players and moves inactive players into a collapsed subsection', async () => {
    await act(async () => {
      render(
        <RecordMatchModal
          isOpen={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
        />
      );
    });

    // Active players should be visible
    expect(await screen.findAllByRole('button', { name: 'Active Alice' })).toHaveLength(2); // Team One & Team Two
    expect(screen.getAllByRole('button', { name: 'Active Bob' })).toHaveLength(2);

    // Inactive player should NOT be in document before expanding
    expect(screen.queryByRole('button', { name: 'Inactive Charlie' })).not.toBeInTheDocument();

    // Toggle button for inactive players should be present
    const inactiveToggles = screen.getAllByRole('button', { name: /Inactive Players \(1\)/i });
    expect(inactiveToggles).toHaveLength(2);

    // Click to expand Inactive Players in Team One
    await act(async () => {
      fireEvent.click(inactiveToggles[0]);
    });

    // Now Inactive Charlie should appear in Team One
    const inactiveCharlieBtns = screen.getAllByRole('button', { name: 'Inactive Charlie' });
    expect(inactiveCharlieBtns).toHaveLength(1);

    // Inactive player can be selected
    await act(async () => {
      fireEvent.click(inactiveCharlieBtns[0]);
    });

    expect(inactiveCharlieBtns[0]).toHaveAttribute('aria-pressed', 'true');
  });
});
