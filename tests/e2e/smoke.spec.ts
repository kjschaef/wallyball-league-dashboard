import { test, expect } from '@playwright/test';

test('has title and basic dashboard elements', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page, 'Page should have Wallyball title').toHaveTitle(/Wallyball/i);

  // Check for the navbar
  await expect(page.locator('nav')).toBeVisible();
});
