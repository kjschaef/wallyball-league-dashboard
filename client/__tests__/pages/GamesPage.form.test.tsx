import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
// Adjust the import path to correctly point to the App Router page
// This might require a path alias in jest.config.cjs or a relative path
import GamesPage from '../../../app/games/page'; 
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock fetch for fetchRecentMatches
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]), // Start with no matches to simplify loading state
  } as Response)
);

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

const renderGamesPage = (queryClient: QueryClient) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <GamesPage />
    </QueryClientProvider>
  );
};

describe('GamesPage - Absence of New Match Form', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    // Reset mock fetch before each test
    (global.fetch as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]), // Default to no matches
      } as Response)
    );
  });

  afterEach(() => {
    queryClient.clear();
  });

  test('does not render the "New Match" form or its heading', async () => {
    renderGamesPage(queryClient);

    // Wait for loading to complete
    // The loading state is true until fetchRecentMatches().finally() is called.
    // We should wait for an element that appears after loading, like the "Recent Matches" heading or "No recent matches found."
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Recent Matches/i, level: 2 })).toBeVisible();
    });


    // Assert that the "New Match" heading is not present
    const newMatchHeading = screen.queryByRole('heading', { name: /New Match/i, level: 2 });
    expect(newMatchHeading).not.toBeInTheDocument();

    // Assert that specific form elements (e.g., a button with "Record Match" text from the old form) are not present
    // This button was specific to the removed form, not the FAB.
    const recordMatchButton = screen.queryByRole('button', { name: /Record Match/i });
    // Be careful if "Record Match" text is used elsewhere (e.g. FAB).
    // The original form's submit button was "Record Match". The FAB has a "Record Match" menu item.
    // The dialog that opens from FAB has a "Record Game" title and a "Record Game" submit button.
    // So, checking for a button with "Record Match" text that is NOT part of a menu should be specific enough.
    
    // To be more specific, let's check for a form structure or labels associated with the old form.
    const teamOneLabel = screen.queryByText(/Team 1/i); // This was a heading for team selection
    const gamesWonLabel = screen.queryByLabelText(/Games Won/i); // This was a label for score inputs

    expect(teamOneLabel).not.toBeInTheDocument(); // This should be specific enough to the old form sections
    expect(gamesWonLabel).not.toBeInTheDocument();
  });
});
