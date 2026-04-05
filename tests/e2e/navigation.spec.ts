import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to all main pages', async ({ page }) => {
    // Current Navbar should have links
    const nav = page.locator('nav');

    // Check Dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Check Results
    await page.click('text=Results');
    await expect(page).toHaveURL(/\/results/);

    // Check Signups
    await page.click('text=Signups');
    await expect(page).toHaveURL(/\/signups/);

    // Check Settings
    await page.click('text=Settings');
    await expect(page).toHaveURL(/\/settings/);
  });
});
