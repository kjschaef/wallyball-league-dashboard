import { test, expect } from '@playwright/test';

test.describe('AI Daily Summary Panel', () => {
  test('starts off collapsed and can be expanded to view full summary', async ({ page }) => {
    // Mock the daily summary endpoint
    await page.route('/api/daily-summary', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          summary: 'Detailed AI generated summary highlighting top player stats and recent match streaks.',
        }),
      });
    });

    await page.goto('/');

    // Wait for the panel toggle button to render
    const toggleButton = page.getByRole('button', { name: /AI League Report/i });
    await expect(toggleButton).toBeVisible({ timeout: 30000 });

    // Panel should start collapsed
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByText('Expand summary')).toBeVisible();
    await expect(page.getByText('Detailed AI generated summary highlighting top player stats and recent match streaks.')).not.toBeVisible();

    // Click to expand
    await toggleButton.click();

    // Verify expanded state
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('Collapse')).toBeVisible();
    await expect(page.getByText('Detailed AI generated summary highlighting top player stats and recent match streaks.')).toBeVisible();

    // Click to collapse again
    await toggleButton.click();
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByText('Detailed AI generated summary highlighting top player stats and recent match streaks.')).not.toBeVisible();
  });
});
