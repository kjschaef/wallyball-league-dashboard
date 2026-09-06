import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to all main pages on desktop', async ({ page }) => {
    // Current Navbar should have links (verify it exists)
    await expect(page.getByRole('navigation', { name: 'Main Navigation' })).toBeVisible();

    // Check Dashboard
    await page.getByRole('navigation', { name: 'Main Navigation' }).getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/.*\/$/); // Dashboard is the root page

    // Check Matches
    await page.getByRole('navigation', { name: 'Main Navigation' }).getByRole('link', { name: 'Matches' }).click();
    await expect(page).toHaveURL(/\/games/);

    // Check Results
    await page.getByRole('navigation', { name: 'Main Navigation' }).getByRole('link', { name: 'Results' }).click();
    await expect(page).toHaveURL(/\/results/);

    // Check Signups
    await page.getByRole('navigation', { name: 'Main Navigation' }).getByRole('link', { name: 'Signups' }).click();
    await expect(page).toHaveURL(/\/signups/);
  });

  test('should support mobile tab bar navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileNav = page.getByRole('navigation', { name: 'Mobile Navigation' });
    await expect(mobileNav).toBeVisible();

    // Check Results from mobile tab bar
    await mobileNav.getByRole('link', { name: 'Results' }).click();
    await expect(page).toHaveURL(/\/results/);

    // Check Signups from mobile tab bar
    await mobileNav.getByRole('link', { name: 'Signups' }).click();
    await expect(page).toHaveURL(/\/signups/);

    // Check Dashboard from mobile tab bar
    await mobileNav.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/.*\/$/);
  });
});
