import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WhiteboardResultsCard } from '@/app/components/WhiteboardResultsCard';
import { ChatBot } from '@/app/components/ChatBot';
import { normalizeWhiteboardMatches } from '@/app/lib/whiteboard';

jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: React.ReactNode }) {
    return <div data-testid="markdown">{children}</div>;
  };
});

jest.mock('@/app/components/AdminProvider', () => ({
  useAdmin: () => ({
    isAdmin: false,
    login: jest.fn(),
    requireAdmin: jest.fn(),
  }),
}));

describe('WhiteboardResultsCard & ChatBot whiteboard upload', () => {
  const roster = ['Nate', 'Ben', 'Keith', 'Hal', 'Mark', 'Vamsi', 'Seth', 'Zach'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders parsed matches, blocks unplayed matches, and submits confirmed matches to /api/chatbot/whiteboard/log', async () => {
    const normalized = normalizeWhiteboardMatches(
      [
        {
          matchNumber: 1,
          teamOne: { players: ['Nate', 'Ben', 'Keith'] },
          teamTwo: { players: ['Hal', 'Mark', 'Vamsi'] },
          games: [
            { teamOneScore: 5, teamTwoScore: 11 },
            { teamOneScore: 11, teamTwoScore: 6 },
            { teamOneScore: 11, teamTwoScore: 7 },
          ],
          played: true,
        },
        {
          matchNumber: 2,
          teamOne: { players: ['Nate', 'Keith', 'Seth'] },
          teamTwo: { players: ['Hal', 'Vamsi', 'Zach'] },
          games: [],
          played: false,
        },
      ],
      roster
    );

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logged: [{ id: 42 }] }),
    } as Response);

    render(
      <WhiteboardResultsCard
        matches={normalized.matches}
        initialDate="2026-10-23"
        roster={roster}
      />
    );

    expect(screen.getByText('Match 1')).toBeInTheDocument();
    expect(screen.getByText('2 - 1')).toBeInTheDocument();
    expect(screen.getByText(/Match 2/i)).toBeInTheDocument();
    expect(screen.getByText(/\(Unplayed — skipped\)/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', {
      name: /Confirm & log 1 match for 2026-10-23/i,
    });
    expect(confirmBtn).toBeEnabled();

    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(/Logged 1 match for 2026-10-23/i)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/chatbot/whiteboard/log',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('allows adding an unknown player to the roster with one click and submits newPlayers', async () => {
    const partialRoster = ['Nate', 'Ben', 'Keith', 'Mark', 'Vamsi'];
    const normalized = normalizeWhiteboardMatches(
      [
        {
          matchNumber: 1,
          teamOne: { players: ['Nate', 'Ben', 'Keith'] },
          teamTwo: { players: ['Hal', 'Mark', 'Vamsi'] },
          games: [{ teamOneScore: 11, teamTwoScore: 7 }],
          played: true,
        },
      ],
      partialRoster
    );

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logged: [{ id: 99 }] }),
    } as Response);

    render(
      <WhiteboardResultsCard
        matches={normalized.matches}
        initialDate="2026-10-23"
        roster={partialRoster}
      />
    );

    const addHalBtn = screen.getByRole('button', {
      name: /\+ Add "Hal" as new player/i,
    });
    expect(addHalBtn).toBeInTheDocument();

    fireEvent.click(addHalBtn);

    const confirmBtn = screen.getByRole('button', {
      name: /Confirm & log 1 match for 2026-10-23/i,
    });
    expect(confirmBtn).toBeEnabled();

    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(/Logged 1 match for 2026-10-23/i)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/chatbot/whiteboard/log',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"newPlayers":["Hal"]'),
      })
    );
  });

  it('shows QuickActions including "Log today\'s matches" immediately and uploads whiteboard photo via dedicated input', async () => {
    const normalized = normalizeWhiteboardMatches(
      [
        {
          matchNumber: 1,
          teamOne: { players: ['Nate', 'Ben', 'Keith'] },
          teamTwo: { players: ['Hal', 'Mark', 'Vamsi'] },
          games: [{ teamOneScore: 11, teamTwoScore: 7 }],
          played: true,
        },
      ],
      roster
    );

    global.fetch = jest.fn().mockImplementation((url: RequestInfo) => {
      const u = String(url);
      if (u === '/api/chatbot') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'ready', playerCount: 8 }),
        } as Response);
      }
      if (u === '/api/player-stats' || u === '/api/players') {
        return Promise.resolve({
          ok: true,
          json: async () => roster.map((name, i) => ({ id: i + 1, name })),
        } as Response);
      }
      if (u === '/api/chatbot/whiteboard') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            response: 'Here are the matches I read from the whiteboard.',
            type: 'whiteboard_results',
            timestamp: new Date().toISOString(),
            date: '2026-10-23',
            additionalData: {
              matches: normalized.matches,
              roster,
              date: '2026-10-23',
            },
          }),
        } as Response);
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) } as Response);
    });

    render(<ChatBot isOpen={true} />);

    // QuickAction button is immediately available even before /api/chatbot status finishes
    const logButton = screen.getByRole('button', { name: /Log today's matches/i });
    expect(logButton).toBeInTheDocument();

    const fileInput = screen.getByTestId('whiteboard-file-input') as HTMLInputElement;
    const testFile = new File(['dummy-jpeg'], 'whiteboard.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/Whiteboard matches — please check before logging/i)
      ).toBeInTheDocument();
    });
  });
});
