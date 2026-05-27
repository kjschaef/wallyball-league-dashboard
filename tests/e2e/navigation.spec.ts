import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 90000 });
  });

  test('should navigate to all main pages', async ({ page }) => {
    // Current Navbar should have links (verify it exists). We use exact match or filter
    // to avoid strict mode violations from Next.js dev tools overlay navigation.
    const nav = page.getByRole('navigation').filter({ hasText: 'Wallyball League' });
    await expect(nav).toBeVisible();

    // The click targets need to be specific to avoid matching other links on the page.
    // Dashboard page
    await nav.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/.*\/$/); // Dashboard is the root page

    // Results page
    await nav.getByRole('link', { name: 'Results' }).click();
    await expect(page).toHaveURL(/\/results/);

    // Signups page
    await nav.getByRole('link', { name: 'Signups', exact: true }).click();
    await expect(page).toHaveURL(/\/signups/);

    // Settings page
    await nav.getByRole('link', { name: 'Settings', exact: true }).click();
    await expect(page).toHaveURL(/\/settings/);
  });
});
