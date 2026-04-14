import { test, expect } from '@playwright/test';

test.describe('Results Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to results
    await page.goto('/results', { waitUntil: 'networkidle', timeout: 90000 });
  });

  test('should render the Results & Standings page with statistics', async ({ page }) => {
    // Expect header
    await expect(page.getByRole('heading', { name: 'Results & Standings' })).toBeVisible();

    // Check for Lifetime Games card
    await expect(page.getByText('Lifetime Games')).toBeVisible();

    // The statistics values should exist (Total Matches, Total Games, Total Days Played)
    await expect(page.getByText('Total Matches')).toBeVisible();
    await expect(page.getByText('Total Games')).toBeVisible();
    await expect(page.getByText('Total Days Played')).toBeVisible();

    // Navigate to games list via 'View all games' and ensure it works
    const viewAllGames = page.getByRole('link', { name: 'View all games' });
    await expect(viewAllGames).toBeVisible();

    await viewAllGames.click();
    await expect(page).toHaveURL(/\/games/);
    
    // There should be a heading 'Match History' on the games page
    await expect(page.getByRole('heading', { name: 'Match History' })).toBeVisible();
  });
});
