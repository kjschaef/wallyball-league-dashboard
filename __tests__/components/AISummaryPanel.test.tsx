import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AISummaryPanel } from '@/app/components/AISummaryPanel';

jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: React.ReactNode }) {
    return <div data-testid="markdown">{children}</div>;
  };
});

describe('AISummaryPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows loading placeholder while generating daily summary', async () => {
    // Hang fetch so it stays in loading state
    global.fetch = jest.fn().mockImplementation(() => new Promise(() => {}));

    render(<AISummaryPanel />);

    expect(screen.getByText('Generating daily summary...')).toBeInTheDocument();
  });

  it('renders collapsed by default and can be expanded and collapsed', async () => {
    const mockSummary = 'Here is the summary of recent matches and player stats.';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ summary: mockSummary }),
    });

    const onAskAIMock = jest.fn();

    render(<AISummaryPanel onAskAI={onAskAIMock} />);

    // Wait for data fetch to complete and toggle button to be available
    const toggleButton = await screen.findByRole('button', { name: /AI League Report/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(/Expand summary/i)).toBeInTheDocument();

    // Summary content should NOT be in the document when collapsed
    expect(screen.queryByText(mockSummary)).not.toBeInTheDocument();
    expect(screen.queryByText(/Read full report/i)).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(toggleButton);

    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Collapse/i)).toBeInTheDocument();
    expect(screen.getByText(mockSummary)).toBeInTheDocument();

    const readFullReportBtn = screen.getByRole('button', { name: /Read full report/i });
    expect(readFullReportBtn).toBeInTheDocument();

    fireEvent.click(readFullReportBtn);
    expect(onAskAIMock).toHaveBeenCalledTimes(1);

    // Click to collapse
    fireEvent.click(toggleButton);

    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(mockSummary)).not.toBeInTheDocument();
    expect(screen.queryByText(/Read full report/i)).not.toBeInTheDocument();
  });

  it('renders nothing when summary is empty', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ summary: '' }),
    });

    const { container } = render(<AISummaryPanel />);

    await waitFor(() => {
      expect(screen.queryByText('Generating daily summary...')).not.toBeInTheDocument();
    });

    expect(container.firstChild).toBeNull();
  });

  it('handles fetch errors gracefully without crashing', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(<AISummaryPanel />);

    await waitFor(() => {
      expect(screen.queryByText('Generating daily summary...')).not.toBeInTheDocument();
    });

    expect(container.firstChild).toBeNull();
    consoleErrorSpy.mockRestore();
  });
});
