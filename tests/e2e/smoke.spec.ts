import { test, expect } from '@playwright/test';

test('has title and basic dashboard elements', async ({ page }) => {
  // Use a longer timeout for the initial navigation in CI
  await page.goto('/', { waitUntil: 'networkidle', timeout: 60000 });

  // Expect a title "to contain" a substring.
  await expect(page, 'Page should have Wallyball title').toHaveTitle(/Wallyball/i);

  // Check for the navbar
  await expect(page.locator('nav')).toBeVisible();

  // Wait for application content to ensure we are not on a login or error page
  await expect(page.getByText('Win Percentage', { exact: false })).toBeVisible({ timeout: 30000 });
});
